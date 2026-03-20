from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.models.schemas import (
    RecommendationResponse,
    UserProfileInput,
    UserProfileResponse,
    SavedBill,
    SaveBillRequest,
    DistrictMpVote,
)
from app.services.auth import AuthError, verify_id_token, delete_cognito_user
from app.services.dynamodb import get_profile, upsert_profile, delete_profile
from app.services.db import get_bills_info, get_district_mp_vote
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
    if "electoral_district_id" in item and item["electoral_district_id"] is not None:
        item["electoral_district_id"] = str(item["electoral_district_id"])
    if isinstance(item.get("demographics"), dict):
        demo_id = item["demographics"].get("electoral_district_id")
        if demo_id is not None:
            item["demographics"]["electoral_district_id"] = str(demo_id)
    return item


@router.put("/me/profile", response_model=UserProfileResponse)
def put_my_profile(payload: UserProfileInput, user=Depends(_get_user)):
    now = datetime.now(timezone.utc).isoformat()
    existing = get_profile(user["sub"])

    demographics = dict(payload.demographics or {})

    # Normalize district fields from payload and demographics so they are always
    # persisted consistently for district-vote lookups.
    electoral_district = payload.electoral_district or demographics.get("electoral_district")
    electoral_district_id = payload.electoral_district_id or demographics.get("electoral_district_id")

    if electoral_district is not None:
        electoral_district = str(electoral_district).strip() or None
    if electoral_district_id is not None:
        electoral_district_id = str(electoral_district_id).strip() or None

    if electoral_district:
        demographics["electoral_district"] = electoral_district
    else:
        demographics.pop("electoral_district", None)

    if electoral_district_id:
        demographics["electoral_district_id"] = electoral_district_id
    else:
        demographics.pop("electoral_district_id", None)

    item = {
        "user_id": user["sub"],
        "username": payload.username,
        "email": user.get("email") or payload.email,
        "interests": payload.interests,
        "demographics": demographics,
        "onboarded": payload.onboarded,
        "updatedAt": now,
    }
    if electoral_district:
        item["electoral_district"] = electoral_district
    if electoral_district_id:
        item["electoral_district_id"] = str(electoral_district_id)
    if existing and "saved_bill_ids" in existing:
        item["saved_bill_ids"] = existing.get("saved_bill_ids") or []
    if not existing:
        item["saved_bill_ids"] = []
        item["createdAt"] = now
    return upsert_profile(user["sub"], item)


@router.get("/me/recommendations", response_model=RecommendationResponse)
def get_my_recommendations(
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    user=Depends(_get_user),
):
    item = get_profile(user["sub"])
    if not item:
        raise HTTPException(status_code=404, detail="Profile not found")
    interests = item.get("interests", [])
    recommendations = recommend_bills(
        interests=interests,
        demographics=item.get("demographics", {}),
        limit=limit,
        offset=offset,
    )
    return RecommendationResponse(recommendations=recommendations)

@router.get("/me/saved", response_model=list[SavedBill])
def get_my_saved(user=Depends(_get_user)):
    item = get_profile(user["sub"])
    if not item:
        raise HTTPException(status_code=404, detail="Profile not found")
    saved_ids = item.get("saved_bill_ids") or []
    return get_bills_info(saved_ids)


@router.get("/me/bills/{bill_id}/district-vote", response_model=DistrictMpVote)
def get_my_district_vote(bill_id: int, user=Depends(_get_user)):
    item = get_profile(user["sub"])
    if not item:
        raise HTTPException(status_code=404, detail="Profile not found")

    district_id = item.get("electoral_district_id")
    if district_id is None and isinstance(item.get("demographics"), dict):
        district_id = item["demographics"].get("electoral_district_id")

    district_name = item.get("electoral_district")
    if district_name is None and isinstance(item.get("demographics"), dict):
        district_name = item["demographics"].get("electoral_district")

    if district_id is None:
        response = DistrictMpVote(
            bill_id=bill_id,
            electoral_district=district_name,
            electoral_district_id=None,
            available=False,
        )
        # print(f"[district-vote] response={response.model_dump()}")
        return response

    vote_info = get_district_mp_vote(bill_id, str(district_id))
    if not vote_info:
        response = DistrictMpVote(
            bill_id=bill_id,
            electoral_district=district_name,
            electoral_district_id=str(district_id),
            available=False,
        )
        # print(f"[district-vote] response={response.model_dump()}")
        return response

    # Prefer the district name from profile if present.
    vote_info["electoral_district"] = district_name or vote_info.get("electoral_district")
    response = DistrictMpVote(**vote_info)
    # print(f"[district-vote] response={response.model_dump()}")
    return response

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
