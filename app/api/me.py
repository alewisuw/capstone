from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.models.schemas import (
    RecommendationResponse,
    UserProfileInput,
    UserProfileResponse,
    SavedBill,
    SaveBillRequest,
)
from app.services.auth import AuthError, verify_id_token, delete_cognito_user
from app.services.dynamodb import get_profile, upsert_profile, delete_profile
from app.services.db import get_bills_info
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
    username = payload.get("cognito:username") or payload.get("username") or sub
    return {
        "sub": sub,
        "email": payload.get("email"),
        "username": username,
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
    existing = get_profile(user["sub"])
    item = {
        "user_id": user["sub"],
        "username": payload.username,
        "email": user.get("email") or payload.email,
        "interests": payload.interests,
        "demographics": payload.demographics,
        "onboarded": payload.onboarded,
        "updatedAt": now,
    }
    if existing and "saved_bill_ids" in existing:
        item["saved_bill_ids"] = existing.get("saved_bill_ids") or []
    if not existing:
        item["saved_bill_ids"] = []
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

@router.get("/me/saved", response_model=list[SavedBill])
def get_my_saved(user=Depends(_get_user)):
    item = get_profile(user["sub"])
    if not item:
        raise HTTPException(status_code=404, detail="Profile not found")
    saved_ids = item.get("saved_bill_ids") or []
    return get_bills_info(saved_ids)

@router.post("/me/saved", response_model=list[int])
def save_bill(payload: SaveBillRequest, user=Depends(_get_user)):
    bill_id = payload.bill_id
    item = get_profile(user["sub"])
    if not item:
        raise HTTPException(status_code=404, detail="Profile not found")
    saved_ids = [int(x) for x in item.get("saved_bill_ids") or []]
    if bill_id not in saved_ids:
        saved_ids.append(bill_id)
    item["saved_bill_ids"] = saved_ids
    item["updatedAt"] = datetime.now(timezone.utc).isoformat()
    upsert_profile(user["sub"], item)
    return saved_ids

@router.delete("/me/saved/{bill_id}", response_model=list[int])
def unsave_bill(bill_id: int, user=Depends(_get_user)):
    item = get_profile(user["sub"])
    if not item:
        raise HTTPException(status_code=404, detail="Profile not found")
    saved_ids = [int(x) for x in item.get("saved_bill_ids") or []]
    saved_ids = [saved_id for saved_id in saved_ids if saved_id != bill_id]
    item["saved_bill_ids"] = saved_ids
    item["updatedAt"] = datetime.now(timezone.utc).isoformat()
    upsert_profile(user["sub"], item)
    return saved_ids

@router.delete("/me")
def delete_my_account(user=Depends(_get_user)):
    username = user.get("username")
    if not username:
        raise HTTPException(status_code=400, detail="Missing Cognito username")
    try:
        delete_cognito_user(username)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to delete Cognito user: {exc}") from exc
    delete_profile(user["sub"])
    return {"status": "deleted"}
