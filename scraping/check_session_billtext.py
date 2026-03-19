"""
Verify that bills for a session exist in both bills_bill and bills_billtext.

Usage:
    python scraping/check_session_billtext.py --session 45-1
    python scraping/check_session_billtext.py --session 45-1 --show-missing 20
"""

import argparse
import sys

import psycopg2

sys.path.insert(0, ".")
from app.config.settings import DB_CFG


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check session coverage between bills_bill and bills_billtext"
    )
    parser.add_argument(
        "--session",
        required=True,
        help="Parliament session id, e.g. 45-1",
    )
    parser.add_argument(
        "--show-missing",
        type=int,
        default=25,
        help="How many missing rows to print (default: 25)",
    )
    args = parser.parse_args()

    conn = psycopg2.connect(**DB_CFG)
    cur = conn.cursor()

    cur.execute(
        """
        SELECT COUNT(*)
        FROM bills_bill b
        WHERE b.session_id = %s
        """,
        (args.session,),
    )
    total_bills = cur.fetchone()[0]

    cur.execute(
        """
        SELECT COUNT(*)
        FROM bills_bill b
        WHERE b.session_id = %s
          AND EXISTS (
                SELECT 1
                FROM bills_billtext bt
                WHERE bt.bill_id = b.id
          )
        """,
        (args.session,),
    )
    bills_with_billtext = cur.fetchone()[0]

    cur.execute(
        """
        SELECT b.id, b.number, b.legisinfo_id, b.text_docid, b.name_en
        FROM bills_bill b
        WHERE b.session_id = %s
          AND NOT EXISTS (
                SELECT 1
                FROM bills_billtext bt
                WHERE bt.bill_id = b.id
          )
        ORDER BY b.number_only, b.number
        """,
        (args.session,),
    )
    missing_rows = cur.fetchall()

    cur.close()
    conn.close()

    missing_count = len(missing_rows)

    print(f"Session: {args.session}")
    print(f"Bills in bills_bill: {total_bills}")
    print(f"Bills with at least one bills_billtext row: {bills_with_billtext}")
    print(f"Bills missing from bills_billtext: {missing_count}")

    if total_bills > 0:
        pct = (bills_with_billtext / total_bills) * 100.0
        print(f"Coverage: {pct:.2f}%")

    if missing_rows:
        print("\nMissing bills (sample):")
        for row in missing_rows[: args.show_missing]:
            bill_id, number, legisinfo_id, text_docid, name_en = row
            print(
                f"- bill_id={bill_id}, number={number}, legisinfo_id={legisinfo_id}, "
                f"text_docid={text_docid}, name_en={name_en}"
            )

    # Non-zero exit makes this easy to use in CI or scripts.
    return 1 if missing_count > 0 else 0


if __name__ == "__main__":
    raise SystemExit(main())
