from fastapi import APIRouter, Query
from app.services.search import semantic_search, title_search

router = APIRouter()

@router.get("/", summary="Bill search (semantic or title)")
def search(
    q: str = Query(..., min_length=1),
    mode: str = Query("semantic", regex="^(semantic|title)$"),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
):
    if mode == "title":
        return title_search(q, limit, offset)
    return semantic_search(q, limit, offset)
