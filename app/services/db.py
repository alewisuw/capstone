import psycopg2
from app.config.settings import DB_CFG

def get_bill_info(bill_id: int):
    try:
        conn = psycopg2.connect(**DB_CFG)
        cur = conn.cursor()
        cur.execute("""
            SELECT bt.llm_summary, bt.summary_en, b.name_en, b.number
            FROM bills_billtext bt
            JOIN bills_bill b ON bt.bill_id = b.id
            WHERE bt.bill_id = %s;
        """, (bill_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
    except Exception as exc:
        err = f"[DB error: {exc}]"
        return {"summary": err, "title": err}

    if not row:
        return {"summary": "[No summary found]", "title": "[No title found]"}

    summary = row[0] or row[1] or "[No summary found]"
    title = row[2] or "[No title found]"
    bill_number = row[3]
    return {
        "summary": summary,
        "title": title,
        "bill_number": bill_number,
    }
