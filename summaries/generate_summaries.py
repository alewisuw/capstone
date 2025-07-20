import json
import boto3
import psycopg2
import requests
from google.oauth2 import service_account
import google.auth.transport.requests
from sentence_transformers import SentenceTransformer

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
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

# --- Local Config --- change as needed this works for my local db
PG_CONFIG = {
    "dbname": "billsdb",
    "user": "postgres",
    "password": "postgres",
    "host": "localhost",
    "port": 5432,
}


def get_token():
    service_account_info = json.loads(SERVICE_ACCOUNT_JSON)
    creds = service_account.Credentials.from_service_account_info(
        service_account_info,
        scopes=["https://www.googleapis.com/auth/generative-language"]
    )
    creds.refresh(google.auth.transport.requests.Request())
    return creds.token

def summarize(text, token):
    """
    Generate a single digestible summary of the bill with:
    - Introduction/purpose
    - Bullet points for key changes/impacts/takeaways
    Designed for ~1 minute reading time.
    """
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    prompt_text = (
    "You are an AI tasked with summarizing Canadian legal bills. "
    "Do not include any introductory phrases or conversational responses. "
    "Just output the summary based on provided text only.\n\n"
    "The summary should:\n"
    "- Begin with a short, clear introduction explaining what the bill is and its purpose.\n"
    "- Be followed by bullet points outlining the key changes, impacts, and takeaways.\n"
    "- Be written in plain, unbiased language and take no more than 1 minute to read.\n\n"
    f"{text[:12000]}"
)


    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt_text}
                ]
            }
        ]
    }

    response = requests.post(GEMINI_URL, json=payload, headers=headers)
    response.raise_for_status()
    result = response.json()
    return result["candidates"][0]["content"]["parts"][0]["text"]

def main():
    token = get_token()

    # conn = psycopg2.connect(
    #     host=DB_HOST,
    #     port=DB_PORT,
    #     dbname=DB_NAME,
    #     user=DB_USER,
    #     password=DB_PASS
    # )
    # cursor = conn.cursor()

    # --- Connect to PostgreSQL ---
    conn = psycopg2.connect(**PG_CONFIG)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT bill_id, text_en FROM bills_billtext WHERE bill_id = 8526
        ORDER BY created DESC LIMIT 1
    """)
    bills = cursor.fetchall()

    results = []

    for bill_id, full_text in bills:
        try:
            summary = summarize(full_text, token)
            print(f"--- Bill ID: {bill_id} ---")
            print(summary)
            print("\n\n")
            results.append({
                "bill_id": bill_id,
                "summary": summary
            })

            # Optional: Insert summary back into DB
            # cursor.execute("""
            #     INSERT INTO bill_summaries (bill_id, summary)
            #     VALUES (%s, %s)
            # """, (bill_id, summary))
            # conn.commit()
        except Exception as e:
            print(f"Error summarizing bill {bill_id}: {e}")
            conn.rollback()

    cursor.close()
    conn.close()

    return {"status": "tested", "summarized_count": len(results)}

model = SentenceTransformer('all-MiniLM-L6-v2')

def get_embedding(text):
    return model.encode(text).tolist()  # type: ignore

if __name__ == "__main__":
    response = main()
    print("Response:", response)
