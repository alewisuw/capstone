import json
import psycopg2
import os
import torch
import collections.abc
import boto3
from transformers import pipeline

print("All basic imports complete!")
# Load tags from tags.json
TAGS_PATH = os.path.join(os.path.dirname(__file__), 'tags.json')
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
    print("Loading transformers pipeline (this may take a moment)...")

    
    classifier = pipeline(
        "zero-shot-classification",
        model = "facebook/bart-large-mnli",
        device=0 if torch.cuda.is_available() else -1
    )

    # Connect to db
    conn = psycopg2.connect(**PG_CONFIG)
    cursor = conn.cursor()
    print("connected to DB")

    #add column if it isn't already there
    cursor.execute("""
    ALTER TABLE bills_billtext
    ADD COLUMN IF NOT EXISTS llm_tags JSON
    """)
    cursor.execute("SELECT bill_id, llm_summary FROM bills_billtext WHERE llm_summary IS NOT NULL AND llm_tags IS NULL")
    bills = cursor.fetchall()

    for bill_id, llm_summary in bills:
        if not llm_summary:
            continue
        try:
            result = classifier(llm_summary, CANDIDATE_LABELS, multi_label=True)
            # If result is not a dict, try to convert to list and take the first dict element
            if not isinstance(result, dict):
                if result is not None and isinstance(result, collections.abc.Iterable):
                    result_list = list(result)
                    if len(result_list) > 0 and isinstance(result_list[0], dict):
                        result = result_list[0]
                    else:
                        print(f"No valid result for bill_id {bill_id}")
                        continue
                else:
                    print(f"No valid result for bill_id {bill_id}")
                    continue
            if isinstance(result, dict) and 'labels' in result and 'scores' in result:
                result = dict(result)  # type: ignore
                tag_scores = dict(zip(result['labels'], result['scores']))
                # Store as JSON in a new column, or update an existing one (assume column is 'llm_tags')
                cursor.execute(
                    """
                    UPDATE bills_billtext
                    SET llm_tags = %s
                    WHERE bill_id = %s
                    """,
                    (json.dumps(tag_scores), bill_id)
                )
                conn.commit()
                print(f"Tagged bill_id {bill_id}: {tag_scores}")
            else:
                print(f"No valid result for bill_id {bill_id}")
                continue
        except Exception as e:
            print(f"Error tagging bill_id {bill_id}: {e}")
            conn.rollback()

    cursor.close()
    conn.close()

if __name__ == "__main__":
    print("Starting tagging...")
    main()   