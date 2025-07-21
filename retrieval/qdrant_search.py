import json
import sys
import psycopg2
import boto3
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient

# --- Config ---
COLLECTION_NAME = "bill_text_embeddings"
TAGS_FILE = "tagging/tags.json"

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


# --- Load embedding model ---
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

# --- Load valid topics from tags.json ---
with open(TAGS_FILE, "r") as f:
    tag_data = json.load(f)

valid_terms = [term.lower() for sublist in tag_data.values() for term in sublist]

# --- Ask user for input ---
print("Search topics examples:")
print(", ".join(valid_terms))
while True:
    user_input = input("Enter your search term or 'q' to quit: ").strip().lower()
    if user_input == "q":
        print("Exiting search.")
        break

    if not user_input:
        print("Please enter a search term or 'q' to quit.")
        continue

    # --- Embed the query ---
    query_vector = model.encode(user_input).tolist()  # type: ignore

    # --- Connect to Qdrant ---
    qdrant = QdrantClient("localhost", port=6333)

    # --- Search Qdrant ---
    results = qdrant.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_vector,
        limit=3,
        with_payload=True,
        with_vectors=False,
    )

    def get_bill_info(bill_id):
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
                SELECT bt.llm_summary, b.name_en
                FROM bills_billtext bt
                JOIN bills_bill b ON bt.bill_id = b.id
                WHERE bt.bill_id = %s;
            """, (bill_id,))
            row = cur.fetchone()
            cur.close()
            conn.close()
            if row:
                return {
                    "summary": row[0] or "[No summary found]",
                    "title": row[1] or "[No title found]"
                }
            else:
                return {
                    "summary": "[No summary found]",
                    "title": "[No title found]"
                }
        except Exception as e:
            return {
                "summary": f"[DB error: {e}]",
                "title": f"[DB error: {e}]"
            }


    # --- Display results ---
    print(f"\nTop 3 results for: '{user_input}'\n" + "=" * 50)

    for i, hit in enumerate(results, 1):
        payload = hit.payload or {}
        bill_id = payload.get("bill_id")
        if bill_id is None:
            continue

        bill_info = get_bill_info(bill_id)
        print(f"\nResult #{i}")
        print(f"Bill ID: {bill_id}")
        print(f"Title: {bill_info['title']}")
        print("Summary:")
        print(bill_info['summary'])
        print("-" * 50)
