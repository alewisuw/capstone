from pydantic import BaseModel
from typing import List, Optional, Dict

class BillRecommendation(BaseModel):
    bill_id: int
    bill_number: Optional[str] = None
    title: str
    summary: str
    score: Optional[float] = None
    parliament_session: Optional[str] = None
    last_updated: Optional[str] = None
    tags: Optional[List[str]] = None
    status_code: Optional[str] = None
    is_new_bill: Optional[int] = None

class SavedBill(BaseModel):
    bill_id: int
    bill_number: Optional[str] = None
    title: str
    summary: str
    parliament_session: Optional[str] = None
    last_updated: Optional[str] = None
    tags: Optional[List[str]] = None
    status_code: Optional[str] = None
    is_new_bill: Optional[int] = None

class SaveBillRequest(BaseModel):
    bill_id: int

class UserProfile(BaseModel):
    name: str
    interests: List[str]
    demographics: Dict


class UserProfileInput(BaseModel):
    username: str
    email: str
    interests: List[str] = []
    demographics: Dict = {}
    onboarded: bool = False
    electoral_district: Optional[str] = None
    electoral_district_id: Optional[str] = None


class UserProfileResponse(UserProfileInput):
    user_id: str
    saved_bill_ids: Optional[List[int]] = None

class RecommendationResponse(BaseModel):
    recommendations: List[BillRecommendation]


class DistrictMpVote(BaseModel):
    bill_id: int
    electoral_district: Optional[str] = None
    electoral_district_id: Optional[str] = None
    available: bool = False
    mp_name: Optional[str] = None
    mp_party: Optional[str] = None
    vote: Optional[str] = None
    position: Optional[str] = None
    vote_date: Optional[str] = None
    vote_result: Optional[str] = None
