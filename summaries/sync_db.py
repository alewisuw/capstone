#TODO: Script to sync the updates from the source db to our db.

import psycopg2

SOURCE_DB = {
    "host": "source-db-host",
    "port": 5432,
    "dbname": "source_db_name",
    "user": "postgres",
    "password": "source_password"
}

TARGET_DB = {
    "host": "target-db-host",
    "port": 5432,
    "dbname": "postgres",
    "user": "postgres",
    "password": "target_password"
}

def sync_bills():
    source_conn = psycopg2.connect(**SOURCE_DB)
    target_conn = psycopg2.connect(**TARGET_DB)
    source_cur = source_conn.cursor()
    target_cur = target_conn.cursor()

    # Step 1: Fetch all bill data from source
    source_cur.execute("SELECT bill_id, title, status, text_en FROM bills_billtext")
    source_bills = source_cur.fetchall()

    for bill_id, title, status, text_en in source_bills:
        try:
            # Step 2: Upsert into target (skip summaries)
            target_cur.execute("""
                INSERT INTO bills_billtext (bill_id, title, status, text_en)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (bill_id) DO UPDATE
                SET title = EXCLUDED.title,
                    status = EXCLUDED.status,
                    text_en = EXCLUDED.text_en
            """, (bill_id, title, status, text_en))

        except Exception as e:
            print(f"Failed to sync bill {bill_id}: {e}")
            target_conn.rollback()
            continue

    target_conn.commit()
    print(f"Synced {len(source_bills)} bills.")

    # Cleanup
    source_cur.close()
    target_cur.close()
    source_conn.close()
    target_conn.close()

if __name__ == "__main__":
    sync_bills()
