from fastapi import APIRouter, HTTPException, Query
import json
import os

from app.models.schemas import RecommendationResponse
from app.config.settings import settings
from app.services.recommendations import recommend_bills

router = APIRouter()

PROFILE_DIR = settings["paths"]["profiles"]

@router.get("/{username}", response_model=RecommendationResponse)
def get_recommendations(
    username: str,
    limit: int = Query(5, ge=1, le=20),
):
    profile_path = os.path.join(PROFILE_DIR, f"{username.lower()}.json")
    if not os.path.exists(profile_path):
        raise HTTPException(404, "Profile not found")

    with open(profile_path) as f:
        profile = json.load(f)

    interests = profile.get("interests", [])
    if not interests:
        raise HTTPException(400, "No interests found in profile")

    recommendations = recommend_bills(
        interests=interests,
        demographics=profile.get("demographics", {}),
        limit=limit,
    )

    return RecommendationResponse(recommendations=recommendations)
