from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import json
import os
import sys
import boto3
import psycopg2
import numpy as np
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'retrieval'))
from embedding_fusion import EmbeddingFusion

app = FastAPI()

# CORS middleware for React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Config ---
COLLECTION_NAME = "bill_text_embeddings"
PROFILE_DIR = os.path.join(os.path.dirname(__file__), "..", "retrieval", "profiles")

# Initialize AWS SSM for parameters
ssm = boto3.client('ssm', region_name='ca-central-1')

PARAMETER_NAMES = [
    '/billBoard/GEMINI_API_KEY',
    '/billBoard/DB_HOST',
    '/billBoard/DB_PASSWORD',
    '/billBoard/SERVICE_ACCOUNT_JSON'
]

def get_parameters(names, with_decryption=True):
    try:
        response = ssm.get_parameters(
            Names=names,
            WithDecryption=with_decryption
        )
        parameters = {param['Name']: param['Value'] for param in response['Parameters']}
        if response['InvalidParameters']:
            print(f"Missing parameters: {response['InvalidParameters']}")
        return parameters
    except Exception as e:
        print(f"Error getting parameters: {e}")
        # Return None values for local development
        return {name: None for name in names}

creds = get_parameters(PARAMETER_NAMES)

DB_HOST = creds.get('/billBoard/DB_HOST') or 'localhost'
DB_PORT = 5432
DB_NAME = 'postgres'
DB_USER = 'postgres'
DB_PASS = creds.get('/billBoard/DB_PASSWORD') or 'postgres'

# Initialize models and clients (lazy loading)
model = None
qdrant = None
fusion = None

def get_model():
    global model
    if model is None:
        model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    return model

def get_qdrant():
    global qdrant
    if qdrant is None:
        qdrant = QdrantClient("localhost", port=6333)
    return qdrant

def get_fusion():
    global fusion
    if fusion is None:
        fusion = EmbeddingFusion()
    return fusion

# --- Pydantic Models ---
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
    user_profile: UserProfile

# --- Database helper function ---
def get_bill_info(bill_id: int):
    """Fetch bill title and summary from PostgreSQL database"""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        cur = conn.cursor()
        cur.execute("""
            SELECT bt.llm_summary, b.name_en
            FROM bills_billtext bt
            JOIN bills_bill b ON bt.bill_id = b.id
            WHERE bt.bill_id = %s;
        """, (bill_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if row:
            summary = row[0] or "[No summary found]"
            title = row[1] or "[No title found]"
            return {
                "summary": summary,
                "title": title,
            }
        else:
            return {
                "summary": "[No summary found]",
                "title": "[No title found]",
            }
    except Exception as e:
        print(f"Database error: {e}")
        return {
            "summary": f"[DB error: {str(e)}]",
            "title": f"[DB error: {str(e)}]",
        }

def get_payload_by_id(bill_id: int):
    qdrant_client = get_qdrant()
    scroll = qdrant_client.scroll(
        collection_name=COLLECTION_NAME,
        scroll_filter={"must": [{"key": "bill_id", "match": {"value": bill_id}}]},
        limit=1,
        with_payload=True,
        with_vectors=False
    )
    return scroll[0][0].payload if scroll[0] else {"bill_id": bill_id}

# --- API Endpoints ---
@app.get("/")
def read_root():
    return {"message": "Welcome to Billboard API"}

@app.get("/api/profiles", response_model=List[str])
def list_profiles():
    """List all available user profiles"""
    try:
        profiles = []
        if os.path.exists(PROFILE_DIR):
            for filename in os.listdir(PROFILE_DIR):
                if filename.endswith('.json'):
                    profiles.append(filename.replace('.json', ''))
        return profiles
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/profiles/{username}", response_model=UserProfile)
def get_profile(username: str):
    """Get a user profile by username"""
    profile_path = os.path.join(PROFILE_DIR, f"{username.lower()}.json")
    if not os.path.exists(profile_path):
        raise HTTPException(status_code=404, detail=f"Profile not found: {username}")
    
    try:
        with open(profile_path, "r") as f:
            profile = json.load(f)
        return UserProfile(**profile)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/recommendations/{username}", response_model=RecommendationResponse)
def get_recommendations(username: str, limit: int = 5):
    """Get bill recommendations for a user"""
    # Load profile
    profile_path = os.path.join(PROFILE_DIR, f"{username.lower()}.json")
    if not os.path.exists(profile_path):
        raise HTTPException(status_code=404, detail=f"Profile not found: {username}")
    
    try:
        with open(profile_path, "r") as f:
            profile_data = json.load(f)
        
        interests = profile_data.get("interests", [])
        demographics = profile_data.get("demographics", {})
        
        if not interests:
            raise HTTPException(status_code=400, detail="No interests found in profile")
        
        # Initialize services
        fusion_client = get_fusion()
        qdrant_client = get_qdrant()
        
        # Create fused embedding
        fused_vector = fusion_client.create_fused_embedding(
            interests=interests,
            demographics=demographics
        )
        
        # Search Qdrant
        search_results = qdrant_client.search(
            collection_name=COLLECTION_NAME,
            query_vector=fused_vector.tolist(),
            limit=limit,
            with_payload=True,
            with_vectors=False,
        )
        
        # Format results
        recommendations = []
        for hit in search_results:
            bill_id = hit.payload.get("bill_id")
            if bill_id:
                bill_info = get_bill_info(bill_id)
                recommendations.append(BillRecommendation(
                    bill_id=bill_id,
                    title=bill_info['title'],
                    summary=bill_info['summary'],
                    score=float(hit.score) if hasattr(hit, 'score') else None
                ))
        
        return RecommendationResponse(
            recommendations=recommendations,
            user_profile=UserProfile(**profile_data)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting recommendations: {str(e)}")
