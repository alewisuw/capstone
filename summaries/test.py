import boto3
import psycopg2
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct
from sentence_transformers import SentenceTransformer

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
    SELECT bill_id, text_en, llm_summary
    FROM bills_billtext WHERE bill_id = 1800
    ORDER BY created DESC
""")

rows = cur.fetchall()


for idx, (bill_id, text, llm_summary) in enumerate(rows):
        print(text)
        print(llm_summary)

# --- Cleanup ---
cur.close()
conn.close()
