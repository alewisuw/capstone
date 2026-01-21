from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.models.schemas import RecommendationResponse, UserProfileInput, UserProfileResponse
from app.services.auth import AuthError, verify_id_token
from app.services.dynamodb import get_profile, upsert_profile
from app.services.recommendations import recommend_bills

router = APIRouter()
auth_scheme = HTTPBearer()


def _get_user(credentials: HTTPAuthorizationCredentials = Depends(auth_scheme)):
    try:
        payload = verify_id_token(credentials.credentials)
    except AuthError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {
        "sub": sub,
        "email": payload.get("email"),
    }


@router.get("/me/profile", response_model=UserProfileResponse)
def get_my_profile(user=Depends(_get_user)):
    item = get_profile(user["sub"])
    if not item:
        raise HTTPException(status_code=404, detail="Profile not found")
    return item


@router.put("/me/profile", response_model=UserProfileResponse)
def put_my_profile(payload: UserProfileInput, user=Depends(_get_user)):
    now = datetime.now(timezone.utc).isoformat()
    item = {
        "user_id": user["sub"],
        "username": payload.username,
        "email": user.get("email") or payload.email,
        "interests": payload.interests,
        "demographics": payload.demographics,
        "onboarded": payload.onboarded,
        "updatedAt": now,
    }
    if not get_profile(user["sub"]):
        item["createdAt"] = now
    return upsert_profile(user["sub"], item)


@router.get("/me/recommendations", response_model=RecommendationResponse)
def get_my_recommendations(limit: int = 5, user=Depends(_get_user)):
    item = get_profile(user["sub"])
    if not item:
        raise HTTPException(status_code=404, detail="Profile not found")
    interests = item.get("interests", [])
    if not interests:
        raise HTTPException(status_code=400, detail="No interests found in profile")
    recommendations = recommend_bills(
        interests=interests,
        demographics=item.get("demographics", {}),
        limit=limit,
    )
    return RecommendationResponse(recommendations=recommendations)
