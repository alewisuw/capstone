import json
import psycopg2
import os
import collections.abc
import boto3

# Load tags from tags.json
# TAGS_PATH = os.path.join(os.path.dirname(__file__), 'new_tags.json')
# with open(TAGS_PATH, 'r', encoding='utf-8') as f:
#     tags_data = json.load(f)
# CANDIDATE_LABELS = list(tags_data.keys())

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

    # Duplicate the bills_billtext table
    cursor.execute("""SELECT
                mv.vote,
                vq.date,
                vq.result,
                p.name,
                party.short_name_en,
                r.name_en
            FROM bills_votequestion vq
            JOIN bills_membervote mv ON mv.votequestion_id = vq.id
            JOIN core_electedmember em ON em.id = mv.member_id
            LEFT JOIN core_politician p ON p.id = COALESCE(mv.politician_id, em.politician_id)
            LEFT JOIN core_party party ON party.id = em.party_id
            LEFT JOIN core_riding r ON r.id = em.riding_id
            WHERE vq.bill_id = 1884
            AND em.riding_id = 35104
            ORDER BY vq.date DESC NULLS LAST, vq.id DESC
            LIMIT 1;
""")
    conn.commit()
    row = cursor.fetchone()
    print(row)

    cursor.close()
    conn.close()


    vote, vote_date, vote_result, mp_name, mp_party, district_name_from_vote = row
    vote_normalized = (vote or "").strip().lower()
    print(vote_normalized)
    position = None
    if vote_normalized in {"y", "yea", "yes", "for"}:
        position = "for"
    elif vote_normalized in {"n", "nay", "no", "against"}:
        position = "against"
    elif vote_normalized in {"a", "p", "paired", "abstain", "abstained"}:
        position = "abstain"

    print(position)
    print(vote_result)

if __name__ == "__main__":
    print("Starting tagging...")
    main()   