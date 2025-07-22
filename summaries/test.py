import boto3
import psycopg2
# from qdrant_client import QdrantClient
# from qdrant_client.models import VectorParams, Distance, PointStruct
# from sentence_transformers import SentenceTransformer

# --- Local Config --- change as needed this works for my local db
PG_CONFIG = {
    "dbname": "billsdb",
    "user": "postgres",
    "password": "postgres",
    "host": "localhost",
    "port": 5432,
}

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

GEMINI_API_KEY = creds['/billBoard/GEMINI_API_KEY']
DB_HOST = creds['/billBoard/DB_HOST']
DB_PORT = 5432
DB_NAME = 'postgres'
DB_USER = 'postgres'
DB_PASS = creds['/billBoard/DB_PASSWORD']
SERVICE_ACCOUNT_JSON = creds['/billBoard/SERVICE_ACCOUNT_JSON']



# --- Connect to PostgreSQL ---
conn = psycopg2.connect(
    host=DB_HOST,
    port=DB_PORT,
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASS
)
cur = conn.cursor()


cur.execute("""
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE table bills_duplicate_bills AS (
SELECT 
    b1.id as bill1_id,
    b2.id as bill2_id,
    similarity(bt1.text_en, bt2.text_en) as text_similarity_score,
    b1.name_en as bill_name
FROM public.bills_bill b1
JOIN public.bills_bill b2
ON 1=1
  -- ON b1.sponsor_member_id = b2.sponsor_member_id
  AND b1.introduced <> b2.introduced
  AND b1.id < b2.id  -- Avoid duplicate pairs for better performance
  AND b1.name_en = b2.name_en  -- EXACT name match required
JOIN public.bills_billtext bt1 ON bt1.bill_id = b1.id
JOIN public.bills_billtext bt2 ON bt2.bill_id = b2.id
WHERE similarity(bt1.text_en, bt2.text_en) > 0.6
ORDER BY text_similarity_score DESC)
""")

rows = cur.fetchall()

print(rows)
for idx, (bill_id, text, llm_summary) in enumerate(rows):
        print(text)
        print(llm_summary)

# --- Cleanup ---
cur.close()
conn.close()
