from fastapi import APIRouter, Query
from app.services.search import semantic_search

router = APIRouter()

@router.get("/", summary="Semantic bill search")
def search(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
):
    return semantic_search(q, limit, offset)
