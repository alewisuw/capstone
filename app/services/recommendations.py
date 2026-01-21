import numpy as np
import torch
from typing import Dict, List

from app.services.qdrant import get_qdrant, COLLECTION_NAME
from app.services.embeddings import get_fusion
from app.services.db import get_bill_info
from app.models.schemas import BillRecommendation

def _build_recommendations(hits) -> List[BillRecommendation]:
    output = []
    for hit in hits:
        payload = hit.payload or {}
        bill_id = payload.get("bill_id")
        if not bill_id:
            continue

        info = get_bill_info(bill_id)
        output.append(
            BillRecommendation(
                bill_id=bill_id,
                title=info["title"],
                summary=info["summary"],
                score=float(hit.score),
            )
        )
    return output

def _fused_search(interests: List[str], demographics: Dict, limit: int):
    fusion = get_fusion()
    qdrant = get_qdrant()

    fused_vector = fusion.create_fused_embedding(
        interests=interests,
        demographics=demographics,
    )

    return qdrant.search(
        collection_name=COLLECTION_NAME,
        query_vector=fused_vector.tolist(),
        limit=limit,
        with_payload=True,
        with_vectors=False,
    )

def recommend_bills(interests, demographics, limit):
    return _build_recommendations(_fused_search(interests, demographics, limit))
