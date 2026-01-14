import numpy as np
import torch
from typing import Dict, List

from app.services.qdrant import get_qdrant, COLLECTION_NAME
from app.services.embeddings import get_fusion, get_model
from app.services.db import get_bill_info
from app.models.schemas import BillRecommendation

def _to_numpy(emb):
    if isinstance(emb, torch.Tensor):
        return emb.cpu().detach().numpy()
    return np.asarray(emb)

def _mean_embedding(model, texts: List[str]) -> np.ndarray:
    if not texts:
        return np.zeros(384)
    emb = _to_numpy(model.encode(texts))
    return emb.mean(axis=0) if emb.ndim > 1 else emb.flatten()

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

def _average_search(interests: List[str], limit: int):
    model = get_model()
    qdrant = get_qdrant()
    avg_vector = _mean_embedding(model, interests)
    return qdrant.search(
        collection_name=COLLECTION_NAME,
        query_vector=avg_vector.tolist(),
        limit=limit,
        with_payload=True,
        with_vectors=False,
    )

def _individual_search(interests: List[str], limit: int):
    model = get_model()
    qdrant = get_qdrant()
    individual_results = []
    for tag in interests:
        vector = model.encode(tag).tolist()
        results = qdrant.search(
            collection_name=COLLECTION_NAME,
            query_vector=vector,
            limit=limit,
            with_payload=True,
            with_vectors=False,
        )
        individual_results.extend(results)
    seen_ids = set()
    unique_results = []
    for hit in sorted(individual_results, key=lambda x: -x.score):
        bill_id = (hit.payload or {}).get("bill_id")
        if bill_id in seen_ids or bill_id is None:
            continue
        seen_ids.add(bill_id)
        unique_results.append(hit)
        if len(unique_results) == limit:
            break
    return unique_results

def _blended_results(avg_results, individual_results, limit: int):
    avg_score_map = {hit.payload.get("bill_id"): hit.score for hit in avg_results if hit.payload}
    tag_score_map = {hit.payload.get("bill_id"): hit.score for hit in individual_results if hit.payload}
    all_ids = set(avg_score_map) | set(tag_score_map)
    blended = []
    for bill_id in all_ids:
        avg_score = avg_score_map.get(bill_id, 0)
        tag_score = tag_score_map.get(bill_id, 0)
        blended.append((bill_id, 0.5 * avg_score + 0.5 * tag_score))
    return sorted(blended, key=lambda x: -x[1])[:limit]

def recommend_bills(interests, demographics, limit, method: str = "fused"):
    method = method.lower()
    if method == "fused":
        return _build_recommendations(_fused_search(interests, demographics, limit))
    if method == "average":
        return _build_recommendations(_average_search(interests, limit))
    if method == "individual":
        return _build_recommendations(_individual_search(interests, limit))
    if method == "blended":
        avg_results = _average_search(interests, limit)
        individual_results = _individual_search(interests, limit)
        blended = _blended_results(avg_results, individual_results, limit)
        output = []
        for bill_id, score in blended:
            if not bill_id:
                continue
            info = get_bill_info(bill_id)
            output.append(
                BillRecommendation(
                    bill_id=bill_id,
                    title=info["title"],
                    summary=info["summary"],
                    score=float(score),
                )
            )
        return output
    raise ValueError(f"Unsupported method: {method}")
