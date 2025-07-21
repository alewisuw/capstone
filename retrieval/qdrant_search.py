import json
import sys
import psycopg2
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient

# --- Config ---
COLLECTION_NAME = "bill_text_embeddings"
TAGS_FILE = "tagging/tags.json"
#change as needed this works for my local db
PG_CONFIG = {
    "dbname": "postgres",
    "user": "postgres",
    "password": "test",
    "host": "localhost",
    "port": 5432,
}

# --- Load embedding model ---
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

# --- Load valid topics from tags.json ---
with open(TAGS_FILE, "r") as f:
    tag_data = json.load(f)

valid_terms = [term.lower() for sublist in tag_data.values() for term in sublist]

# --- Ask user for input ---
print("Available search topics (example):")
print(", ".join(valid_terms[:10]) + ", ...")
user_input = input("\nEnter your search term (must match a listed topic): ").strip().lower()

if user_input not in valid_terms:
    print(f"Invalid topic. Please choose from one of the listed subtopics in '{TAGS_FILE}'")
    sys.exit(1)

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


# --- Connect to PostgreSQL ---
def get_summary(bill_id):
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

# --- Display results ---
print(f"\nTop 3 results for: '{user_input}'\n" + "=" * 50)

for i, hit in enumerate(results, 1):
    payload = hit.payload or {}
    bill_id = payload.get("bill_id")
    if bill_id is None:
        continue

    summary = get_summary(bill_id)
    print(f"\nResult #{i}")
    print(f"Bill ID: {bill_id}")
    print(f"Score: {hit.score:.4f}")
    print("Summary:")
    print(summary[:400].replace("\n", " ") + "...")
    print("-" * 50)
