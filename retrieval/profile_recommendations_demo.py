import json
import sys
import os
import boto3
import psycopg2
import numpy as np
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from embedding_fusion import EmbeddingFusion

# --- Config ---
COLLECTION_NAME = "bill_text_embeddings"
PROFILE_DIR = "retrieval/profiles"


ssm = boto3.client('ssm', region_name='ca-central-1')

PARAMETER_NAMES = [
    '/billBoard/GEMINI_API_KEY',
    '/billBoard/DB_HOST',
    '/billBoard/DB_PASSWORD',
    '/billBoard/SERVICE_ACCOUNT_JSON'
]

def get_parameters(names, with_decryption=True):
    response = ssm.get_parameters(
        Names=names,
        WithDecryption=with_decryption
    )
    parameters = {param['Name']: param['Value'] for param in response['Parameters']}
    if response['InvalidParameters']:
        print(f"Missing parameters: {response['InvalidParameters']}")
    return parameters

creds = get_parameters(PARAMETER_NAMES)

GEMINI_API_KEY = creds['/billBoard/GEMINI_API_KEY']
DB_HOST = creds['/billBoard/DB_HOST']
DB_PORT = 5432
DB_NAME = 'postgres'
DB_USER = 'postgres'
DB_PASS = creds['/billBoard/DB_PASSWORD']
SERVICE_ACCOUNT_JSON = creds['/billBoard/SERVICE_ACCOUNT_JSON']


#LOCAL 
#change as needed this works for my local db
PG_CONFIG = {
    "dbname": "billsdb",
    "user": "postgres",
    "password": "postgres",
    "host": "localhost",
    "port": 5432,
}

# --- Get user from CLI ---
if len(sys.argv) < 2:
    print("Usage: python retrieval/profile_recommendations_demo.py <username>")
    sys.exit(1)

username = sys.argv[1].lower()
profile_path = os.path.join(PROFILE_DIR, f"{username}.json")

if not os.path.exists(profile_path):
    print(f"Profile not found: {profile_path}")
    sys.exit(1)

# --- Load profile ---
with open(profile_path, "r") as f:
    profile = json.load(f)

interests = profile.get("interests", [])
demographics = profile.get("demographics", {})
if not interests:
    print("No interests found in profile.")
    sys.exit(1)

print(f"\nFinding bills for {profile['name']}'s interests: {', '.join(interests)}")
if demographics:
    print(f"Demographics collected: {len(demographics)} categories")
    for key, value in demographics.items():
        if value and value != "prefer_not_to_say":
            print(f"  - {key.replace('_', ' ').title()}: {value.replace('_', ' ').title()}")


# --- Initialize models and clients ---
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
qdrant = QdrantClient("localhost", port=6333)
fusion = EmbeddingFusion()

# --- Database helper function ---
def get_bill_info(bill_id):
    """Fetch bill title and summary from PostgreSQL database"""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        cur = conn.cursor()
        cur.execute("""
            SELECT bt.llm_summary, b.name_en, bt.llm_tags
            FROM bills_billtext bt
            JOIN bills_bill b ON bt.bill_id = b.id
            WHERE bt.bill_id = %s;
        """, (bill_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if row:
            summary = row[0] or "[No summary found]"
            title = row[1] or "[No title found]"
            # tags_raw = row[2]

            # Extract first 3 keys from llm_tags
            # tag_keys = []
            # if tags_raw:
            #     try:
            #         tags_dict = json.loads(tags_raw)
            #         tag_keys = list(tags_dict.keys())[:1]
            #     except json.JSONDecodeError:
            #         tag_keys = ["[Invalid JSON in tags]"]
            # else:
            #     tag_keys = ["[No tags found]"]

            return {
                "summary": summary,
                "title": title,
                # "tags": tag_keys
            }
        else:
            return {
                "summary": "[No summary found]",
                "title": "[No title found]",
                # "tags": ["[No tags found]"]
            }
    except Exception as e:
        return {
            "summary": f"[DB error: {e}]",
            "title": f"[DB error: {e}]",
            "tags": [f"[DB error: {e}]"]
        }

# --- Method 1: Fused embedding search (combines interests + demographics) ---
print("Creating fused embedding...")
fused_vector = fusion.create_fused_embedding(
    interests=interests,
    demographics=demographics
)

fused_results = qdrant.search(
    collection_name=COLLECTION_NAME,
    query_vector=fused_vector.tolist(),
    limit=5,
    with_payload=True,
    with_vectors=False,
)

# --- Method 2: Average vector of interests ---
avg_vector = model.encode(interests).mean(axis=0).tolist() #type: ignore

avg_results = qdrant.search(
    collection_name=COLLECTION_NAME,
    query_vector=avg_vector,
    limit=5,
    with_payload=True,
    with_vectors=False,
)

# --- Method 3: Individual tag queries (collect top scores) ---
individual_results = []

for tag in interests:
    vector = model.encode(tag).tolist() #type: ignore
    results = qdrant.search(
        collection_name=COLLECTION_NAME,
        query_vector=vector,
        limit=5,
        with_payload=True,
        with_vectors=False,
    )
    individual_results.extend(results)

# Deduplicate by ID, sort by score, and get top 3
seen_ids = set()
unique_results = []

for hit in sorted(individual_results, key=lambda x: -x.score):
    bill_id = hit.payload.get("bill_id")
    if bill_id not in seen_ids:
        seen_ids.add(bill_id)
        unique_results.append(hit)
    if len(unique_results) == 5:
        break

# --- Method 4: Blended Results ---
avg_score_map = {hit.payload.get("bill_id"): hit.score for hit in avg_results} #type: ignore
tag_score_map = {hit.payload.get("bill_id"): hit.score for hit in unique_results} #type: ignore

all_ids = set(avg_score_map) | set(tag_score_map)
blended_results = []

for bill_id in all_ids:
    avg_score = avg_score_map.get(bill_id, 0)
    tag_score = tag_score_map.get(bill_id, 0)
    final_score = 0.5 * avg_score + 0.5 * tag_score
    blended_results.append((bill_id, final_score))

# Sort and get top 3 blended results
top_blended = sorted(blended_results, key=lambda x: -x[1])[:5]

# Helper to fetch payload for bill_id
def get_payload_by_id(bill_id):
    scroll = qdrant.scroll(
        collection_name=COLLECTION_NAME,
        scroll_filter={"must": [{"key": "bill_id", "match": {"value": bill_id}}]}, #type: ignore
        limit=1,
        with_payload=True,
        with_vectors=False
    )
    return scroll[0][0].payload if scroll[0] else {"bill_id": bill_id}

# --- Display functions ---
def display_results(results, method_name):
    print(f"\nTop 5 results ({method_name})\n" + "=" * 50)
    for i, hit in enumerate(results, 1):
        bill_id = hit.payload.get("bill_id", "N/A")
        bill_info = get_bill_info(bill_id)
        print(f"\nResult #{i}")
        print(f"Bill ID: {bill_id}")
        # print(f"Score: {hit.score:.4f}")
        print(f"Title: {bill_info['title']}")
        # print("Tag:", ", ".join(bill_info['tags']))
        print("Summary:")
        print(bill_info['summary'])
        print("-" * 50)


def display_blended(results, method_name):
    print(f"\nTop 5 results ({method_name})\n" + "=" * 50)
    for i, (bill_id, score) in enumerate(results, 1):
        payload = get_payload_by_id(bill_id)
        bill_info = get_bill_info(bill_id)
        print(f"\nResult #{i}")
        print(f"Bill ID: {bill_id}")
        # print(f"Score: {hit.score:.4f}")
        print(f"Title: {bill_info['title']}")
        print("Summary:")
        print(bill_info['summary'])
        print("-" * 50)

# --- Output all results ---
display_results(fused_results, "Fused Embedding Search (Interests + Demographics)")
# display_results(avg_results, "Average Vector Search")
# display_results(unique_results, "Top Individual Tag Matches")
# display_blended(top_blended, "Blended Method (Average + Tag Score)")