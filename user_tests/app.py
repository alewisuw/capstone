"""
Lightweight user testing web application for comparing recommendation methods.
Compares fused embeddings vs. individual tag queries.
"""
import csv
import os
import json
from datetime import datetime
from flask import Flask, render_template, request, jsonify
import numpy as np
print("F")
from sentence_transformers import SentenceTransformer
print("U")
from qdrant_client import QdrantClient
import psycopg2
import boto3
import sys

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from retrieval.embedding_fusion import EmbeddingFusion

app = Flask(__name__)

# Simple /api/tags route (no blueprint)
@app.route('/api/tags', methods=['GET'])
def get_tags():
    tags_path = os.path.join(os.path.dirname(__file__), '../tagging/tags.json')
    with open(tags_path, 'r', encoding='utf-8') as f:
        tags = json.load(f)
    return jsonify(tags)

# --- Configuration ---
COLLECTION_NAME = "bill_text_embeddings"
CSV_OUTPUT_DIR = "user_tests/results"
os.makedirs(CSV_OUTPUT_DIR, exist_ok=True)

# AWS SSM for credentials
ssm = boto3.client('ssm', region_name='ca-central-1')

PARAMETER_NAMES = [
    '/billBoard/DB_HOST',
    '/billBoard/DB_PASSWORD',
]

def get_parameters(names, with_decryption=True):
    response = ssm.get_parameters(
        Names=names,
        WithDecryption=with_decryption
    )
    parameters = {param['Name']: param['Value'] for param in response['Parameters']}
    return parameters

try:
    creds = get_parameters(PARAMETER_NAMES)
    DB_HOST = creds['/billBoard/DB_HOST']
    DB_PASS = creds['/billBoard/DB_PASSWORD']
except:
    # Fallback to local for development
    DB_HOST = 'localhost'
    DB_PASS = 'postgres'

DB_PORT = 5432
DB_NAME = 'postgres'
DB_USER = 'postgres'

# Initialize models and clients
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
qdrant = QdrantClient("localhost", port=6333)
fusion = EmbeddingFusion()

# --- Helper Functions ---
def get_bill_info(bill_id):
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
            return {
                "summary": row[0] or "[No summary found]",
                "title": row[1] or "[No title found]"
            }
        else:
            return {
                "summary": "[No summary found]",
                "title": "[No title found]"
            }
    except Exception as e:
        return {
            "summary": f"[DB error: {e}]",
            "title": f"[DB error: {e}]"
        }

def get_fused_recommendations(interests, demographics, limit=3):
    """Method 1: Fused embedding search (interests + demographics)"""
    fused_vector = fusion.create_fused_embedding(
        interests=interests,
        demographics=demographics
    )
    
    results = qdrant.search(
        collection_name=COLLECTION_NAME,
        query_vector=fused_vector.tolist(),
        limit=limit,
        with_payload=True,
        with_vectors=False,
    )
    
    bills = []
    for hit in results:
        bill_id = hit.payload.get("bill_id")
        if bill_id:
            info = get_bill_info(bill_id)
            bills.append({
                "bill_id": bill_id,
                "title": info["title"],
                "summary": info["summary"],
                "score": float(hit.score)
            })
    
    return bills

def get_tag_query_recommendations(interests, limit=3):
    """Method 2: Reciprocal Rank Fusion across individual tag queries"""
    if not interests:
        return []
    
    # Get separate rankings for each interest/tag
    all_rankings = []
    for tag in interests:
        vector = model.encode(tag).tolist()
        results = qdrant.search(
            collection_name=COLLECTION_NAME,
            query_vector=vector,
            limit=10,  # Get more results per tag for better fusion
            with_payload=True,
            with_vectors=False,
        )
        all_rankings.append(results)
    
    # Apply reciprocal rank fusion
    k = 60
    scores = {}
    
    for ranking in all_rankings:
        weight = 1.0 / len(all_rankings)  # Equal weight for each tag
        for rank, hit in enumerate(ranking, start=1):
            bill_id = hit.payload.get("bill_id")
            if bill_id:
                scores[bill_id] = scores.get(bill_id, 0) + weight / (k + rank)
    
    # Sort by fused score
    sorted_bills = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    
    # Get top N bills
    bills = []
    for bill_id, fused_score in sorted_bills[:limit]:
        info = get_bill_info(bill_id)
        bills.append({
            "bill_id": bill_id,
            "title": info["title"],
            "summary": info["summary"],
            "score": float(fused_score)
        })
    
    return bills

def save_to_csv(data):
    """Save user test results to CSV"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = os.path.join(CSV_OUTPUT_DIR, f"user_test_{timestamp}.csv")
    
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['method', 'bill_id', 'bill_title', 'relevance', 'summary_effective', 'interests', 'demographics']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for row in data:
            writer.writerow(row)
    
    return filename

def save_feedback_to_csv(feedback_data):
    """Append feedback to a single feedback CSV file"""
    feedback_file = os.path.join(CSV_OUTPUT_DIR, "general_feedback.csv")
    file_exists = os.path.exists(feedback_file)
    
    with open(feedback_file, 'a', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['timestamp', 'interests', 'demographics', 'method_preference', 'general_feedback']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        if not file_exists:
            writer.writeheader()
        
        writer.writerow(feedback_data)
    
    return feedback_file

# --- Routes ---
@app.route('/')
def index():
    """First page: Demographics and interests input"""
    return render_template('index.html')

@app.route('/api/recommendations', methods=['POST'])
def get_recommendations():
    """API endpoint to get recommendations from both methods"""
    data = request.json
    interests = data.get('interests', [])
    demographics = data.get('demographics', {})
    
    # Filter out empty demographics
    filtered_demographics = {k: v for k, v in demographics.items() if v and v != 'prefer_not_to_say'}
    
    try:
        fused_bills = get_fused_recommendations(interests, filtered_demographics)
        tag_bills = get_tag_query_recommendations(interests)
        
        return jsonify({
            'success': True,
            'fused': fused_bills,
            'tag_query': tag_bills
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/compare')
def compare():
    """Second page: Side-by-side comparison"""
    return render_template('compare.html')

@app.route('/api/submit', methods=['POST'])
def submit_results():
    """Save user feedback to CSV"""
    data = request.json
    interests = data.get('interests', [])
    demographics = data.get('demographics', {})
    fused_responses = data.get('fused_responses', {})
    tag_responses = data.get('tag_responses', {})
    method_preference = data.get('method_preference', '')
    general_feedback = data.get('general_feedback', '')
    
    # Prepare CSV rows
    csv_data = []
    interests_str = ', '.join(interests)
    demographics_str = json.dumps(demographics)
    
    # Add fused embedding results
    for bill_id, bill_data in fused_responses.items():
        csv_data.append({
            'method': 'fused_embedding',
            'bill_id': bill_id,
            'bill_title': bill_data['title'],
            'relevance': 1 if bill_data['relevance'] == 'relevant' else 0,
            'summary_effective': 1 if bill_data.get('summary_effective', '') == 'yes' else 0,
            'interests': interests_str,
            'demographics': demographics_str
        })
    
    # Add tag query results
    for bill_id, bill_data in tag_responses.items():
        csv_data.append({
            'method': 'tag_query',
            'bill_id': bill_id,
            'bill_title': bill_data['title'],
            'relevance': 1 if bill_data['relevance'] == 'relevant' else 0,
            'summary_effective': 1 if bill_data.get('summary_effective', '') == 'yes' else 0,
            'interests': interests_str,
            'demographics': demographics_str
        })
    
    try:
        # Save bill ratings
        filename = save_to_csv(csv_data)
        
        # Save general feedback to separate CSV (include method preference)
        feedback_data = {
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'interests': interests_str,
            'demographics': demographics_str,
            'method_preference': method_preference,
            'general_feedback': general_feedback
        }
        save_feedback_to_csv(feedback_data)
        
        return jsonify({
            'success': True,
            'filename': filename
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=False, port=5001)
