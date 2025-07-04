import json
import sys
import os
import psycopg2
import numpy as np
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from demographic_enums import validate_demographics
from embedding_fusion import EmbeddingFusion

# --- Config ---
COLLECTION_NAME = "bill_text_embeddings"
PROFILE_DIR = "summaries/profiles"
#change as needed this works for my local db
PG_CONFIG = {
    "dbname": "postgres",
    "user": "postgres",
    "password": "test",
    "host": "localhost",
    "port": 5432,
}

# --- Get user from CLI ---
if len(sys.argv) < 2:
    print("❌ Usage: python profile_recommendations.py <username>")
    sys.exit(1)

username = sys.argv[1].lower()
profile_path = os.path.join(PROFILE_DIR, f"{username}.json")

if not os.path.exists(profile_path):
    print(f"❌ Profile not found: {profile_path}")
    sys.exit(1)

# --- Load profile ---
with open(profile_path, "r") as f:
    profile = json.load(f)

interests = profile.get("interests", [])
demographics = profile.get("demographics", {})
if not interests:
    print("❌ No interests found in profile.")
    sys.exit(1)

print(f"\n🔍 Finding bills for {profile['name']}'s interests: {', '.join(interests)}")
if demographics:
    print(f"📊 Demographics: Age {demographics.get('age', 'N/A')}, Income: {demographics.get('income', 'N/A')}, Location: {demographics.get('location', 'N/A')}")

# Validate demographics
validation_errors = validate_demographics(demographics)
if validation_errors:
    print("⚠️  Warning: Invalid demographic values found:")
    for field, errors in validation_errors.items():
        for error in errors:
            print(f"   - {error}")

# --- Initialize models and clients ---
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
qdrant = QdrantClient("localhost", port=6333)
fusion = EmbeddingFusion()

# --- Database helper function ---
def get_summary(bill_id):
    """Fetch bill summary from PostgreSQL database"""
    try:
        conn = psycopg2.connect(**PG_CONFIG)
        cur = conn.cursor()
        cur.execute("SELECT summary_en FROM bills_billtext WHERE bill_id = %s;", (bill_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        return row[0] if row else "[No summary found]"
    except Exception as e:
        return f"[DB error: {e}]"

# --- Method 1: Fused embedding search (combines interests + demographics) ---
print("\n🔬 Creating fused embedding...")
fused_vector = fusion.create_fused_embedding(
    interests=interests,
    demographics=demographics,
    strategy="weighted_average",
    weights={"interest": 0.8, "demographic": 0.2}
)

fused_results = qdrant.search(
    collection_name=COLLECTION_NAME,
    query_vector=fused_vector.tolist(),
    limit=3,
    with_payload=True,
    with_vectors=False,
)

# --- Method 2: Interest-only search (for comparison) ---
print("🔬 Creating interest-only embedding...")
interest_vector = fusion.create_interest_embedding(interests)

interest_results = qdrant.search(
    collection_name=COLLECTION_NAME,
    query_vector=interest_vector.tolist(),
    limit=3,
    with_payload=True,
    with_vectors=False,
)

# --- Method 3: Individual interest search ---
print("🔬 Creating individual interest embeddings...")
individual_results = []

for interest in interests:
    vector = fusion.create_interest_embedding([interest])
    results = qdrant.search(
        collection_name=COLLECTION_NAME,
        query_vector=vector.tolist(),
        limit=5,
        with_payload=True,
        with_vectors=False,
    )
    individual_results.extend(results)

# Deduplicate and get top 3 individual results
seen_ids = set()
unique_individual_results = []

for hit in sorted(individual_results, key=lambda x: -x.score):
    bill_id = hit.payload.get("bill_id") if hit.payload else None
    if bill_id and bill_id not in seen_ids:
        seen_ids.add(bill_id)
        unique_individual_results.append(hit)
    if len(unique_individual_results) == 3:
        break

# --- Method 4: Blended Results (combines fused + individual scores) ---
print("🔬 Creating blended results...")
fused_score_map = {hit.payload.get("bill_id"): hit.score for hit in fused_results if hit.payload}
individual_score_map = {hit.payload.get("bill_id"): hit.score for hit in unique_individual_results if hit.payload}

all_ids = set(fused_score_map) | set(individual_score_map)
blended_results = []

for bill_id in all_ids:
    fused_score = fused_score_map.get(bill_id, 0)
    individual_score = individual_score_map.get(bill_id, 0)
    final_score = 0.5 * fused_score + 0.5 * individual_score
    blended_results.append((bill_id, final_score))

# Sort and get top 3 blended results
top_blended = sorted(blended_results, key=lambda x: -x[1])[:3]

# Helper to fetch payload for bill_id
def get_payload_by_id(bill_id):
    """Fetch bill payload from Qdrant by bill_id"""
    scroll = qdrant.scroll(
        collection_name=COLLECTION_NAME,
        scroll_filter={"must": [{"key": "bill_id", "match": {"value": bill_id}}]},  #type: ignore
        limit=1,
        with_payload=True,
        with_vectors=False
    )
    return scroll[0][0].payload if scroll[0] and len(scroll[0]) > 0 else {"bill_id": bill_id}

# --- Display functions ---
def display_results(results, method_name):
    """Display search results with bill details"""
    print(f"\n🔹 {method_name}\n" + "=" * 50)
    for i, hit in enumerate(results, 1):
        bill_id = hit.payload.get("bill_id", "N/A") if hit.payload else "N/A"
        summary = get_summary(bill_id)
        print(f"\nResult #{i}")
        print(f"Bill ID: {bill_id}")
        print(f"Score: {hit.score:.4f}")
        print("Summary:")
        print(summary[:400].replace("\n", " ") + "...")
        print("-" * 50)

def display_blended(results, method_name):
    """Display blended results with bill details"""
    print(f"\n🔷 {method_name}\n" + "=" * 50)
    for i, (bill_id, score) in enumerate(results, 1):
        payload = get_payload_by_id(bill_id)
        summary = get_summary(bill_id)
        print(f"\nResult #{i}")
        print(f"Bill ID: {bill_id}")
        print(f"Blended Score: {score:.4f}")
        print("Summary:")
        print(summary[:400].replace("\n", " ") + "...")
        print("-" * 50)

# --- Output all results ---
display_results(fused_results, "Fused Embedding Search (Interests + Demographics)")
display_results(interest_results, "Interest-Only Search")
display_results(unique_individual_results, "Individual Interest Search")
display_blended(top_blended, "Blended Method (Fused + Individual Scores)")