from app.services.embeddings import get_model
from app.services.qdrant import search_vectors
from app.services.db import get_bill_info

def semantic_search(query: str, limit: int = 3):
    model = get_model()
    vector = model.encode(query).tolist()

    results = search_vectors(vector, limit)

    output = []
    for hit in results:
        bill_id = hit.payload.get("bill_id")
        if not bill_id:
            continue

        info = get_bill_info(bill_id)
        output.append({
            "bill_id": bill_id,
            "bill_number": info.get("bill_number"),
            "title": info["title"],
            "summary": info["summary"],
            "score": float(hit.score),
            "parliament_session": info.get("parliament_session"),
            "last_updated": info.get("last_updated"),
            "tags": info.get("tags"),
            "status_code": info.get("status_code"),
        })

    return output
