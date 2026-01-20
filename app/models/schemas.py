from pydantic import BaseModel
from typing import List, Optional, Dict

class BillRecommendation(BaseModel):
    bill_id: int
    title: str
    summary: str
    score: Optional[float] = None

class UserProfile(BaseModel):
    name: str
    interests: List[str]
    demographics: Dict

class RecommendationResponse(BaseModel):
    recommendations: List[BillRecommendation]
