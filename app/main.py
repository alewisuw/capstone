from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    health,
    search,
    recommendations,
    profiles,
    me,
)

app = FastAPI(title="BillBoard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(search.router, prefix="/api/search", tags=["search"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["recommendations"])
app.include_router(profiles.router, prefix="/api/profiles", tags=["profiles"])
app.include_router(me.router, prefix="/api", tags=["me"])
