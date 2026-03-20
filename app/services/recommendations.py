import numpy as np
import torch
from typing import Dict, List

from app.services.qdrant import get_qdrant, COLLECTION_NAME
from app.services.embeddings import get_fusion
from app.services.db import get_bills_info, get_recent_bills
from app.models.schemas import BillRecommendation

def _build_recommendations(hits) -> List[BillRecommendation]:
    scored = []
    for hit in hits:
        payload = hit.payload or {}
        bill_id = payload.get("bill_id")
        if bill_id:
            scored.append((bill_id, float(hit.score)))

    if not scored:
        return []

    bill_ids = [bid for bid, _ in scored]
    infos = get_bills_info(bill_ids)
    info_map = {info["bill_id"]: info for info in infos}

    output = []
    for bill_id, score in scored:
        info = info_map.get(bill_id)
        if not info:
            continue
        output.append(
            BillRecommendation(
                bill_id=bill_id,
                bill_number=info.get("bill_number"),
                title=info.get("title", "[No title found]"),
                summary=info.get("summary", "[No summary found]"),
                score=score,
                parliament_session=info.get("parliament_session"),
                last_updated=info.get("last_updated"),
                tags=info.get("tags"),
                status_code=info.get("status_code"),
                is_new_bill=info.get("is_new_bill"),
            )
        )
    print(f"[recommendations] bill_ids={bill_ids}")
    return output

def _fused_search(interests: List[str], demographics: Dict, limit: int, offset: int):
    fusion = get_fusion()
    qdrant = get_qdrant()

    fused_vector = fusion.create_fused_embedding(
        interests=interests,
        demographics=demographics,
    )

    if fused_vector is None:
        return None

    return qdrant.search(
        collection_name=COLLECTION_NAME,
        query_vector=fused_vector.tolist(),
        limit=limit,
        offset=offset,
        with_payload=True,
        with_vectors=False,
    )

def recommend_bills(interests, demographics, limit, offset: int = 0):
    hits = _fused_search(interests, demographics, limit, offset)
    if hits is None:
        rows = get_recent_bills(limit=limit, offset=offset)
        return [
            BillRecommendation(
                bill_id=r["bill_id"],
                bill_number=r.get("bill_number"),
                title=r["title"],
                summary=r["summary"],
                score=0.0,
                parliament_session=r.get("parliament_session"),
                last_updated=r.get("last_updated"),
                tags=r.get("tags"),
                status_code=r.get("status_code"),
                is_new_bill=r.get("is_new_bill"),
            )
            for r in rows
        ]
    return _build_recommendations(hits)
