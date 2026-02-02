import json
import sys
import os
import boto3
import psycopg2
import numpy as np
from sentence_transformers import SentenceTransformer
from demographic_enums import DemographicContextGenerator
from qdrant_client import QdrantClient
from embedding_fusion import EmbeddingFusion
from typing import List, Dict, Tuple

# --- Config ---
COLLECTION_NAME = "bill_text_embeddings"
PROFILE_DIR = "retrieval/profiles"

ssm = boto3.client('ssm', region_name='ca-central-1')

PARAMETER_NAMES = [
    '/billBoard/GEMINI_API_KEY',
    '/billBoard/DB_HOST',
    '/billBoard/DB_PASSWORD',
    '/billBoard/SERVICE_ACCOUNT_JSON'
]

def get_parameters(names, with_decryption=True):
    response = ssm.get_parameters(
        Names=names,
        WithDecryption=with_decryption
    )
    parameters = {param['Name']: param['Value'] for param in response['Parameters']}
    if response['InvalidParameters']:
        print(f"Missing parameters: {response['InvalidParameters']}")
    return parameters

creds = get_parameters(PARAMETER_NAMES)

DB_HOST = creds['/billBoard/DB_HOST']
DB_PORT = 5432
DB_NAME = 'postgres'
DB_USER = 'postgres'
DB_PASS = creds['/billBoard/DB_PASSWORD']

# --- Initialize models and clients ---
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
qdrant = QdrantClient("localhost", port=6333)
fusion = EmbeddingFusion()

# --- Database helper function ---
def get_bill_info(bill_id):
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
            return {
                "summary": row[0] or "[No summary found]",
                "title": row[1] or "[No title found]",
            }
        else:
            return {
                "summary": "[No summary found]",
                "title": "[No title found]",
            }
    except Exception as e:
        return {
            "summary": f"[DB error: {str(e)}]",
            "title": f"[DB error: {str(e)}]",
        }

# APPROACH 1: FUSED EMBEDDING (Current)

def fused_embedding_search(interests: List[str], demographics: Dict, limit: int = 5):
    fused_vector = fusion.create_fused_embedding(
        interests=interests,
        demographics=demographics
    )
    
    results = qdrant.search(
        collection_name=COLLECTION_NAME,
        query_vector=fused_vector.tolist(),
        limit=limit * 2,  # Get more for comparison
        with_payload=True,
        with_vectors=False,
    )
    
    return results

# APPROACH 2: SEPARATE RANKINGS 
def interests_only_search(interests: List[str], limit: int = 5):
    if not interests:
        return []
    
    # Average embedding of all interests
    interest_vector = model.encode(interests).mean(axis=0).tolist()
    
    results = qdrant.search(
        collection_name=COLLECTION_NAME,
        query_vector=interest_vector,
        limit=limit * 2,
        with_payload=True,
        with_vectors=False,
    )
    
    return results

def demographics_only_search(demographics: Dict, limit: int = 5):    
    # Generate demographic context terms
    terms = DemographicContextGenerator.generate_demographic_context(demographics) if demographics else []
    
    if not terms:
        return []
    
    # Average embedding of demographic terms
    demo_vector = model.encode(terms).mean(axis=0).tolist()
    
    results = qdrant.search(
        collection_name=COLLECTION_NAME,
        query_vector=demo_vector,
        limit=limit * 2,
        with_payload=True,
        with_vectors=False,
    )
    
    return results

# ============================================================================
# RANKING COMBINATION METHODS
# ============================================================================

def reciprocal_rank_fusion(
    ranking1: List, 
    ranking2: List, 
    k: int = 60,
    weight1: float = 0.8,
    weight2: float = 0.2
) -> List[Tuple[int, float]]:
    # Build score dictionaries
    scores = {}
    
    # Process ranking 1
    for rank, hit in enumerate(ranking1, start=1):
        bill_id = hit.payload.get("bill_id")
        if bill_id:
            scores[bill_id] = scores.get(bill_id, 0) + weight1 / (k + rank)
    
    # Process ranking 2
    for rank, hit in enumerate(ranking2, start=1):
        bill_id = hit.payload.get("bill_id")
        if bill_id:
            scores[bill_id] = scores.get(bill_id, 0) + weight2 / (k + rank)
    
    # Sort by score (descending)
    sorted_bills = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    
    return sorted_bills

def separate_rankings_approach(
    interests: List[str], 
    demographics: Dict, 
    limit: int = 5
) -> List:
    # Get separate rankings
    interests_results = interests_only_search(interests, limit)
    demographics_results = demographics_only_search(demographics, limit)
    
    # Combine rankings using RRF
    combined = reciprocal_rank_fusion(interests_results, demographics_results)
    
    # Get top N bill IDs
    top_bill_ids = [bill_id for bill_id, score in combined[:limit]]
    
    # Fetch full results for top bills
    final_results = []
    for bill_id in top_bill_ids:
        # Get the hit from whichever ranking it came from (prefer interests)
        hit = None
        for h in interests_results:
            if h.payload.get("bill_id") == bill_id:
                hit = h
                break
        if not hit:
            for h in demographics_results:
                if h.payload.get("bill_id") == bill_id:
                    hit = h
                    break
        
        if hit:
            final_results.append(hit)
    
    return final_results

# ============================================================================
# COMPARISON AND DISPLAY
# ============================================================================

def display_results(results, method_name: str, limit: int = 5):
    print(f"\n{'='*80}")
    print(f"{method_name}")
    print(f"{'='*80}")
    
    for i, hit in enumerate(results[:limit], 1):
        bill_id = hit.payload.get("bill_id", "N/A")
        bill_info = get_bill_info(bill_id)
        score = hit.score if hasattr(hit, 'score') else 0
        
        print(f"\n#{i} | Bill ID: {bill_id} | Score: {score:.4f}")
        print(f"Title: {bill_info['title']}")
        print(f"Summary: {bill_info['summary'][:200]}...")
        print("-" * 80)

def compare_approaches(interests: List[str], demographics: Dict, limit: int = 5):
    print("\n" + "="*80)
    print("COMPARING RECOMMENDATION APPROACHES")
    print("="*80)
    
    # Approach 1: Fused Embedding (Current)
    print("\n🔄 Running Approach 1: Fused Embedding...")
    fused_results = fused_embedding_search(interests, demographics, limit)
    
    # Approach 2: Separate Rankings with RRF
    print("\n🔄 Running Approach 2: Separate Rankings (RRF)...")
    rrf_results = separate_rankings_approach(interests, demographics, limit)
    
    # Display results
    display_results(fused_results, "APPROACH 1: Fused Embedding (Current)", limit)
    display_results(rrf_results, "APPROACH 2: Separate Rankings + RRF (New)", limit)
    
    # Analysis
    print("\n" + "="*80)
    print("ANALYSIS")
    print("="*80)
    
    # Get bill IDs from each approach
    fused_bill_ids = {hit.payload.get("bill_id") for hit in fused_results[:limit] if hit.payload.get("bill_id")}
    rrf_bill_ids = {hit.payload.get("bill_id") for hit in rrf_results[:limit] if hit.payload.get("bill_id")}
    
    # Overlap analysis
    overlap = len(fused_bill_ids & rrf_bill_ids)
    
    print(f"\nOverlap Analysis (top {limit} results):")
    print(f"  Fused vs RRF:        {overlap}/{limit} bills in common")
    
    # Unique bills
    print(f"\nUnique bills per approach:")
    print(f"  Fused only:          {len(fused_bill_ids - rrf_bill_ids)} bills")
    print(f"  RRF only:            {len(rrf_bill_ids - fused_bill_ids)} bills")
    
    # Average scores
    avg_score_fused = np.mean([hit.score for hit in fused_results[:limit] if hasattr(hit, 'score')])
    avg_score_rrf = np.mean([hit.score for hit in rrf_results[:limit] if hasattr(hit, 'score')])
    
    print(f"\nAverage similarity scores (top {limit}):")
    print(f"  Fused:               {avg_score_fused:.4f}")
    print(f"  RRF:                 {avg_score_rrf:.4f}")

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    # Get user from CLI
    if len(sys.argv) < 2:
        print("Usage: python retrieval/test_ranking_approaches.py <username> [limit]")
        print("\nAvailable profiles:")
        profiles = [f.replace('.json', '') for f in os.listdir(PROFILE_DIR) if f.endswith('.json')]
        for p in profiles:
            print(f"  - {p}")
        sys.exit(1)
    
    username = sys.argv[1].lower()
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    
    profile_path = os.path.join(PROFILE_DIR, f"{username}.json")
    
    if not os.path.exists(profile_path):
        print(f"Profile not found: {profile_path}")
        sys.exit(1)
    
    # Load profile
    with open(profile_path, "r") as f:
        profile = json.load(f)
    
    interests = [i for i in profile.get("interests", []) if i and i != "nan"]
    demographics = profile.get("demographics", {})
    
    if not interests:
        print("No interests found in profile.")
        sys.exit(1)
    
    print(f"\n{'='*80}")
    print(f"Testing recommendations for: {profile['name']}")
    print(f"{'='*80}")
    print(f"Interests: {len(interests)} topics")
    print(f"Demographics: {len([v for v in demographics.values() if v and v != 'prefer_not_to_say'])} categories")
    
    # Run comparison
    compare_approaches(interests, demographics, limit)
