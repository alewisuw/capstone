import psycopg2
from app.config.settings import DB_CFG
from typing import List, Dict

def get_bill_info(bill_id: int):
    try:
        conn = psycopg2.connect(**DB_CFG)
        cur = conn.cursor()
        cur.execute("""
            SELECT bt.llm_summary, bt.summary_en, b.name_en, b.number, b.session_id, b.status_date
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
    session_id = row[4]
    status_date = row[5]
    return {
        "summary": summary,
        "title": title,
        "bill_number": bill_number,
        "parliament_session": session_id,
        "last_updated": status_date.isoformat() if status_date else None,
    }

def get_bills_info(bill_ids: List[int]) -> List[Dict]:
    if not bill_ids:
        return []

    unique_ids = list(dict.fromkeys(int(bill_id) for bill_id in bill_ids))
    try:
        conn = psycopg2.connect(**DB_CFG)
        cur = conn.cursor()
        cur.execute("""
            SELECT bt.bill_id, bt.llm_summary, bt.summary_en, b.name_en, b.number, b.session_id, b.status_date
            FROM bills_billtext bt
            JOIN bills_bill b ON bt.bill_id = b.id
            WHERE bt.bill_id = ANY(%s);
        """, (unique_ids,))
        rows = cur.fetchall()
        cur.close()
        conn.close()
    except Exception as exc:
        err = f"[DB error: {exc}]"
        return [
            {
                "bill_id": bill_id,
                "summary": err,
                "title": err,
                "bill_number": None,
                "parliament_session": None,
                "last_updated": None,
            }
            for bill_id in unique_ids
        ]

    info_map = {}
    for row in rows:
        bill_id, llm_summary, summary_en, title, bill_number, session_id, status_date = row
        summary = llm_summary or summary_en or "[No summary found]"
        info_map[bill_id] = {
            "bill_id": bill_id,
            "summary": summary,
            "title": title or "[No title found]",
            "bill_number": bill_number,
            "parliament_session": session_id,
            "last_updated": status_date.isoformat() if status_date else None,
        }

    output = []
    for bill_id in unique_ids:
        output.append(info_map.get(
            bill_id,
            {
                "bill_id": bill_id,
                "summary": "[No summary found]",
                "title": "[No title found]",
                "bill_number": None,
                "parliament_session": None,
                "last_updated": None,
            },
        ))
    return output
