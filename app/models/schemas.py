from pydantic import BaseModel
from typing import List, Optional, Dict

class BillRecommendation(BaseModel):
    bill_id: int
    bill_number: Optional[str] = None
    title: str
    summary: str
    score: Optional[float] = None

class SavedBill(BaseModel):
    bill_id: int
    bill_number: Optional[str] = None
    title: str
    summary: str

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


class UserProfileResponse(UserProfileInput):
    user_id: str
    saved_bill_ids: Optional[List[int]] = None

class RecommendationResponse(BaseModel):
    recommendations: List[BillRecommendation]
