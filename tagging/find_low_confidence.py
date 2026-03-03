"""
Step 1: Find bills with low-confidence tags and analyze their summaries
to identify common themes not covered by existing tags.
"""
import json
import psycopg2
import os
import boto3
from collections import Counter

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
DB_HOST = creds['/billBoard/DB_HOST']
PG_CONFIG = {
    "dbname": "postgres",
    "user": "postgres",
    "password": creds['/billBoard/DB_PASSWORD'],
    "host": DB_HOST,
    "port": 5432,
}

# Load existing tags
TAGS_PATH = os.path.join(os.path.dirname(__file__), 'tags.json')
with open(TAGS_PATH, 'r', encoding='utf-8') as f:
    tags_data = json.load(f)
EXISTING_CATEGORIES = list(tags_data.keys())

CONFIDENCE_THRESHOLD = 0.45  # A bill is "low confidence" if its max tag score is below this

def main():
    conn = psycopg2.connect(**PG_CONFIG)
    cursor = conn.cursor()
    print("Connected to DB")

    # Get all bills that have llm_tags
    cursor.execute("""
        SELECT bill_id, llm_summary, llm_tags
        FROM bills_billtext
        WHERE llm_tags IS NOT NULL AND llm_summary IS NOT NULL
    """)
    all_bills = cursor.fetchall()
    print(f"\nTotal bills with tags: {len(all_bills)}")

    low_confidence_bills = []
    all_max_scores = []

    for bill_id, summary, tags_raw in all_bills:
        if tags_raw is None:
            continue
        # tags_raw might be a string or dict depending on driver
        if isinstance(tags_raw, str):
            tags = json.loads(tags_raw)
        else:
            tags = tags_raw

        if not tags:
            continue

        max_score = max(tags.values())
        all_max_scores.append(max_score)

        if max_score < CONFIDENCE_THRESHOLD:
            # Get the top tag for reference
            top_tag = max(tags, key=tags.get)
            low_confidence_bills.append({
                'bill_id': bill_id,
                'summary': summary,
                'tags': tags,
                'max_score': max_score,
                'top_tag': top_tag,
            })

    # Stats
    print(f"\n--- Score Distribution ---")
    brackets = [(0, 0.1), (0.1, 0.2), (0.2, 0.3), (0.3, 0.4), (0.4, 0.5),
                (0.5, 0.6), (0.6, 0.7), (0.7, 0.8), (0.8, 0.9), (0.9, 1.01)]
    for lo, hi in brackets:
        count = sum(1 for s in all_max_scores if lo <= s < hi)
        print(f"  [{lo:.1f}, {hi:.1f}): {count} bills")

    print(f"\nLow confidence bills (max score < {CONFIDENCE_THRESHOLD}): {len(low_confidence_bills)}")

    # Show top tags distribution among low confidence bills
    top_tag_dist = Counter(b['top_tag'] for b in low_confidence_bills)
    print(f"\n--- Top tag distribution among low-confidence bills ---")
    for tag, count in top_tag_dist.most_common():
        print(f"  {tag}: {count}")

    # Print summaries of low-confidence bills for analysis
    print(f"\n--- Summaries of low-confidence bills (first 50) ---")
    for i, bill in enumerate(low_confidence_bills[:50]):
        print(f"\n[{i+1}] bill_id={bill['bill_id']} | max_score={bill['max_score']:.3f} | top_tag={bill['top_tag']}")
        print(f"    Summary: {bill['summary'][:300]}")

    # Print ALL low-confidence summaries to a file for deeper analysis
    output_path = os.path.join(os.path.dirname(__file__), 'low_confidence_bills.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(low_confidence_bills, f, indent=2, default=str)
    print(f"\nFull low-confidence bills written to {output_path}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
