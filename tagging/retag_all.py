"""
Re-tag EVERY bill in the database.

Steps:
  1. Create an llm_tags_old column (if it doesn't exist) and copy the
     current llm_tags values into it as a backup.
  2. Re-run zero-shot classification on every bill that has an llm_summary,
     writing the fresh results into llm_tags.
"""

import argparse
import json
import os
import collections.abc
import boto3
import psycopg2
from transformers import pipeline

# ---------------------------------------------------------------------------
# Tags
# ---------------------------------------------------------------------------
TAGS_PATH = os.path.join(os.path.dirname(__file__), "tags.json")
with open(TAGS_PATH, "r", encoding="utf-8") as f:
    tags_data = json.load(f)
CANDIDATE_LABELS = list(tags_data.keys())
print(f"Candidate labels ({len(CANDIDATE_LABELS)}): {CANDIDATE_LABELS}")

# ---------------------------------------------------------------------------
# Database credentials (via AWS SSM)
# ---------------------------------------------------------------------------
ssm = boto3.client("ssm", region_name="ca-central-1")
PARAMETER_NAMES = [
    "/billBoard/DB_HOST",
    "/billBoard/DB_PASSWORD",
]


def get_parameters(names, with_decryption=True):
    response = ssm.get_parameters(Names=names, WithDecryption=with_decryption)
    parameters = {p["Name"]: p["Value"] for p in response["Parameters"]}
    if response["InvalidParameters"]:
        print(f"Missing parameters: {response['InvalidParameters']}")
    return parameters


creds = get_parameters(PARAMETER_NAMES)
PG_CONFIG = {
    "dbname": "postgres",
    "user": "postgres",
    "password": creds["/billBoard/DB_PASSWORD"],
    "host": creds["/billBoard/DB_HOST"],
    "port": 5432,
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def classify_summary(classifier, summary):
    """Run zero-shot classification and return a {label: score} dict or None."""
    result = classifier(summary, CANDIDATE_LABELS, multi_label=True)

    # Handle generator / list responses
    if not isinstance(result, dict):
        if result is not None and isinstance(result, collections.abc.Iterable):
            result_list = list(result)
            if len(result_list) > 0 and isinstance(result_list[0], dict):
                result = result_list[0]
            else:
                return None
        else:
            return None

    if isinstance(result, dict) and "labels" in result and "scores" in result:
        return dict(zip(result["labels"], result["scores"]))
    return None


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main(untagged_only=False):
    # 1. Load the classifier
    print("Loading transformers pipeline (this may take a moment)...")
    classifier = pipeline(
        "zero-shot-classification",
        model="facebook/bart-large-mnli",
    )

    # 2. Connect to the database
    conn = psycopg2.connect(**PG_CONFIG)
    cursor = conn.cursor()
    print("Connected to DB")

    # 3. Create the staging column for new tags
    cursor.execute("""
        ALTER TABLE bills_billtext
        ADD COLUMN IF NOT EXISTS llm_tags_new JSON
    """)
    conn.commit()

    # Also ensure the backup column exists for later
    cursor.execute("""
        ALTER TABLE bills_billtext
        ADD COLUMN IF NOT EXISTS llm_tags_old JSON
    """)
    conn.commit()
    print("Prepared llm_tags_new and llm_tags_old columns")

    # 4. Fetch bills that need tagging
    if untagged_only:
        cursor.execute("""
            SELECT bill_id, llm_summary
            FROM bills_billtext
            WHERE llm_summary IS NOT NULL
              AND llm_tags_new IS NULL
        """)
        print("Mode: untagged-only (skipping bills that already have llm_tags_new)")
    else:
        cursor.execute("""
            SELECT bill_id, llm_summary
            FROM bills_billtext
            WHERE llm_summary IS NOT NULL
        """)
    bills = cursor.fetchall()
    total = len(bills)
    print(f"Bills to re-tag: {total}")

    # 5. Re-tag each bill
    tagged = 0
    errors = 0
    for i, (bill_id, llm_summary) in enumerate(bills):
        if not llm_summary:
            continue
        short_summary = llm_summary[:80] + "..." if len(llm_summary) > 80 else llm_summary
        try:
            tag_scores = classify_summary(classifier, llm_summary)
            if tag_scores is None:
                print(f"  [{i+1}/{total}] bill_id={bill_id} | {short_summary} — no valid result, skipping")
                continue

            cursor.execute(
                "UPDATE bills_billtext SET llm_tags_new = %s WHERE bill_id = %s",
                (json.dumps(tag_scores), bill_id),
            )
            conn.commit()
            tagged += 1

            top_tag = max(tag_scores, key=tag_scores.get)
            top_score = tag_scores[top_tag]
            print(f"  [{i+1}/{total}] bill_id={bill_id} | {short_summary} | top={top_tag} ({top_score:.3f})")

        except Exception as e:
            print(f"  [{i+1}/{total}] bill_id={bill_id} | {short_summary} — ERROR: {e}")
            conn.rollback()
            errors += 1

    # 6. Promote: backup llm_tags → llm_tags_old, then overwrite llm_tags with llm_tags_new
    print("\nPromoting new tags...")
    cursor.execute("""
        UPDATE bills_billtext
        SET llm_tags_old = llm_tags
        WHERE llm_tags IS NOT NULL
    """)
    cursor.execute("""
        UPDATE bills_billtext
        SET llm_tags = llm_tags_new
        WHERE llm_tags_new IS NOT NULL
    """)
    conn.commit()
    print("Done: llm_tags backed up to llm_tags_old, llm_tags_new promoted to llm_tags")

    # 7. Summary
    print(f"\n--- Summary ---")
    print(f"Total bills processed: {total}")
    print(f"Successfully re-tagged: {tagged}")
    print(f"Errors: {errors}")

    cursor.close()
    conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Re-tag bills in the database.")
    parser.add_argument(
        "--untagged-only",
        action="store_true",
        help="Only tag bills that don't already have llm_tags_new",
    )
    args = parser.parse_args()

    mode = "untagged-only" if args.untagged_only else "all bills"
    print(f"Starting re-tag ({mode})...")
    main(untagged_only=args.untagged_only)
