from fastapi import APIRouter, HTTPException
import os
import json

from app.models.schemas import UserProfile
from app.config.settings import settings

router = APIRouter()

PROFILE_DIR = settings["paths"]["profiles"]

@router.get("/", summary="List available profiles")
def list_profiles():
    if not os.path.exists(PROFILE_DIR):
        return []

    return [
        f.replace(".json", "")
        for f in os.listdir(PROFILE_DIR)
        if f.endswith(".json")
    ]


@router.get("/{username}", response_model=UserProfile)
def get_profile(username: str):
    profile_path = os.path.join(PROFILE_DIR, f"{username.lower()}.json")
    if not os.path.exists(profile_path):
        raise HTTPException(404, "Profile not found")

    with open(profile_path) as f:
        data = json.load(f)

    return UserProfile(**data)
