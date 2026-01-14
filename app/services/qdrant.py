from qdrant_client import QdrantClient
from functools import lru_cache
from app.config.settings import settings

COLLECTION_NAME = settings["collections"]["bill_embeddings"]

@lru_cache
def get_qdrant() -> QdrantClient:
    return QdrantClient(
        host=settings["qdrant"]["host"],
        port=settings["qdrant"]["port"],
    )

def search_vectors(vector, limit: int):
    client = get_qdrant()
    return client.search(
        collection_name=COLLECTION_NAME,
        query_vector=vector,
        limit=limit,
        with_payload=True,
        with_vectors=False,
    )
