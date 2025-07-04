import psycopg2
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct
from sentence_transformers import SentenceTransformer

# --- Local Config --- change as needed this works for my local db
PG_CONFIG = {
    "dbname": "postgres",
    "user": "postgres",
    "password": "test",
    "host": "localhost",
    "port": 5432,
}

# --- Connect to PostgreSQL ---
conn = psycopg2.connect(**PG_CONFIG)
cur = conn.cursor()

cur.execute("""
    SELECT bill_id, text_en
    FROM bills_billtext
    ORDER BY created DESC
""")

rows = cur.fetchall()

# --- Connect to Qdrant ---
qdrant = QdrantClient("localhost", port=6333)

COLLECTION_NAME = "bill_text_embeddings"

if qdrant.collection_exists(COLLECTION_NAME):
    qdrant.delete_collection(collection_name=COLLECTION_NAME)

qdrant.create_collection(
    collection_name=COLLECTION_NAME,
    vectors_config=VectorParams(size=384, distance=Distance.COSINE),
)

# --- Load embedding model ---
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")  # ~384D vectors

# --- Connect to PostgreSQL ---
conn = psycopg2.connect(**PG_CONFIG)
cur = conn.cursor()

cur.execute("""
    SELECT bill_id, text_en
    FROM bills_billtext
    ORDER BY created DESC
""")

rows = cur.fetchall()

# --- Connect to Qdrant ---
qdrant = QdrantClient("localhost", port=6333)

# Create or recreate collection with correct vector size
if not qdrant.collection_exists(COLLECTION_NAME):
    qdrant.recreate_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE),
    )

# --- Embed and Upload ---
points = []

for idx, (bill_id, text) in enumerate(rows):
    if text:
        embedding = model.encode(text).tolist()  # type: ignore
        point = PointStruct(
            id=int(bill_id),  # Must be unique
            vector=embedding,
            payload={"bill_id": bill_id}
        )
        points.append(point)

        # Upload in batches
        if len(points) >= 50:
            qdrant.upsert(collection_name=COLLECTION_NAME, points=points)
            points = []

# Upload remaining
if points:
    qdrant.upsert(collection_name=COLLECTION_NAME, points=points)

print("✅ Done: Embeddings stored in Qdrant.")

# --- Cleanup ---
cur.close()
conn.close()
