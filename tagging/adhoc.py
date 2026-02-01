import json
import psycopg2
import os
import collections.abc
import boto3

# Load tags from tags.json
TAGS_PATH = os.path.join(os.path.dirname(__file__), 'new_tags.json')
with open(TAGS_PATH, 'r', encoding='utf-8') as f:
    tags_data = json.load(f)
CANDIDATE_LABELS = list(tags_data.keys())

# Database config (should match generate_summaries.py)
ssm = boto3.client('ssm', region_name='ca-central-1')
PARAMETER_NAMES = [
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
PG_CONFIG = {
    "dbname": DB_NAME,
    "user": DB_USER,
    "password": DB_PASS,
    "host": DB_HOST,
    "port": DB_PORT,
}

def main():
    


    # Connect to db
    conn = psycopg2.connect(**PG_CONFIG)
    cursor = conn.cursor()
    print("connected to DB")

    cursor.execute("SELECT bill_id, count(bill_id) from bills_billtext where bill_id = 8135 group by bill_id order by count(bill_id) DESC ")


    # cursor.execute("SELECT bill_id, llm_summary, llm_tags FROM bills_billtext WHERE llm_summary ilike '%Sections 9(2) and 18(4) are amended to specify that employees who self-identify or agree to be identified%' limit 1")
    bills = cursor.fetchall()
    print(bills)


    cursor.close()
    conn.close()

if __name__ == "__main__":
    print("Starting tagging...")
    main()   