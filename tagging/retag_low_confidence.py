"""
Re-tag only the low-confidence bills (max tag score < 0.4)
using the updated tags.json which includes new categories.
"""
import json
import psycopg2
import os
import collections.abc
import boto3
from transformers import pipeline

CONFIDENCE_THRESHOLD = 0.45

# Load updated tags
TAGS_PATH = os.path.join(os.path.dirname(__file__), 'tags.json')
with open(TAGS_PATH, 'r', encoding='utf-8') as f:
    tags_data = json.load(f)
CANDIDATE_LABELS = list(tags_data.keys())
print(f"Candidate labels ({len(CANDIDATE_LABELS)}): {CANDIDATE_LABELS}")

# Database config
ssm = boto3.client('ssm', region_name='ca-central-1')
PARAMETER_NAMES = [
    '/billBoard/DB_HOST',
    '/billBoard/DB_PASSWORD',
]

def get_parameters(names, with_decryption=True):
    response = ssm.get_parameters(Names=names, WithDecryption=with_decryption)
    parameters = {param['Name']: param['Value'] for param in response['Parameters']}
    if response['InvalidParameters']:
        print(f"Missing parameters: {response['InvalidParameters']}")
    return parameters

creds = get_parameters(PARAMETER_NAMES)
PG_CONFIG = {
    "dbname": "postgres",
    "user": "postgres",
    "password": creds['/billBoard/DB_PASSWORD'],
    "host": creds['/billBoard/DB_HOST'],
    "port": 5432,
}

def main():
    print("Loading transformers pipeline (this may take a moment)...")
    classifier = pipeline(
        "zero-shot-classification",
        model="facebook/bart-large-mnli",
    )

    conn = psycopg2.connect(**PG_CONFIG)
    cursor = conn.cursor()
    print("Connected to DB")

    # Find all bills that already have tags
    cursor.execute("""
        SELECT bill_id, llm_summary, llm_tags
        FROM bills_billtext
        WHERE llm_tags IS NOT NULL AND llm_summary IS NOT NULL
    """)
    all_bills = cursor.fetchall()
    print(f"Total bills with tags: {len(all_bills)}")

    # Filter to low-confidence bills
    low_confidence = []
    for bill_id, summary, tags_raw in all_bills:
        if not summary or tags_raw is None:
            continue
        tags = json.loads(tags_raw) if isinstance(tags_raw, str) else tags_raw
        if not tags:
            continue
        max_score = max(tags.values())
        if max_score < CONFIDENCE_THRESHOLD:
            low_confidence.append((bill_id, summary))

    # Deduplicate by bill_id (keep first occurrence)
    seen = set()
    unique_low = []
    for bill_id, summary in low_confidence:
        if bill_id not in seen:
            seen.add(bill_id)
            unique_low.append((bill_id, summary))

    print(f"Low-confidence bills to re-tag: {len(unique_low)}")

    retagged = 0
    improved = 0
    for i, (bill_id, summary) in enumerate(unique_low):
        try:
            result = classifier(summary, CANDIDATE_LABELS, multi_label=True)
            if not isinstance(result, dict):
                if result is not None and isinstance(result, collections.abc.Iterable):
                    result_list = list(result)
                    if len(result_list) > 0 and isinstance(result_list[0], dict):
                        result = result_list[0]
                    else:
                        print(f"  No valid result for bill_id {bill_id}")
                        continue
                else:
                    print(f"  No valid result for bill_id {bill_id}")
                    continue

            if isinstance(result, dict) and 'labels' in result and 'scores' in result:
                tag_scores = dict(zip(result['labels'], result['scores']))
                new_max = max(tag_scores.values())
                new_top = max(tag_scores, key=tag_scores.get)

                cursor.execute(
                    "UPDATE bills_billtext SET llm_tags = %s WHERE bill_id = %s",
                    (json.dumps(tag_scores), bill_id)
                )
                conn.commit()
                retagged += 1

                if new_max >= CONFIDENCE_THRESHOLD:
                    improved += 1

                print(f"  [{i+1}/{len(unique_low)}] bill_id={bill_id} | new_max={new_max:.3f} | top={new_top} | {'IMPROVED' if new_max >= CONFIDENCE_THRESHOLD else 'still low'}")
            else:
                print(f"  No valid result for bill_id {bill_id}")
        except Exception as e:
            print(f"  Error re-tagging bill_id {bill_id}: {e}")
            conn.rollback()

    print(f"\n--- Summary ---")
    print(f"Bills re-tagged: {retagged}/{len(unique_low)}")
    print(f"Bills improved above {CONFIDENCE_THRESHOLD} threshold: {improved}/{retagged}")
    print(f"Bills still low confidence: {retagged - improved}/{retagged}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    print("Starting re-tagging of low-confidence bills...")
    main()
