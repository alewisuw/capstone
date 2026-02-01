import json
import psycopg2
from app.config.settings import DB_CFG
from typing import List, Dict, Optional

def _extract_tag_labels(raw_tags, min_score: float = 0.3, max_tags: int = 2) -> Optional[List[str]]:
    if not raw_tags:
        return None
    tags_dict = raw_tags
    if isinstance(raw_tags, str):
        try:
            tags_dict = json.loads(raw_tags)
        except json.JSONDecodeError:
            return None
    if not isinstance(tags_dict, dict):
        return None
    sorted_tags = sorted(tags_dict.items(), key=lambda item: item[1], reverse=True)
    labels = [
        label
        for label, score in sorted_tags
        if isinstance(score, (int, float)) and score >= min_score
    ]
    labels = labels[:max_tags]
    return labels or None

def get_bill_info(bill_id: int):
    try:
        conn = psycopg2.connect(**DB_CFG)
        cur = conn.cursor()
        cur.execute("""
            SELECT bt.llm_summary, bt.summary_en, b.name_en, b.number, b.session_id, b.status_date, bt.llm_tags
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
    tags = _extract_tag_labels(row[6])
    return {
        "summary": summary,
        "title": title,
        "bill_number": bill_number,
        "parliament_session": session_id,
        "last_updated": status_date.isoformat() if status_date else None,
        "tags": tags,
    }

def get_bills_info(bill_ids: List[int]) -> List[Dict]:
    if not bill_ids:
        return []

    unique_ids = list(dict.fromkeys(int(bill_id) for bill_id in bill_ids))
    try:
        conn = psycopg2.connect(**DB_CFG)
        cur = conn.cursor()
        cur.execute("""
            SELECT bt.bill_id, bt.llm_summary, bt.summary_en, b.name_en, b.number, b.session_id, b.status_date, bt.llm_tags
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
        bill_id, llm_summary, summary_en, title, bill_number, session_id, status_date, llm_tags = row
        summary = llm_summary or summary_en or "[No summary found]"
        info_map[bill_id] = {
            "bill_id": bill_id,
            "summary": summary,
            "title": title or "[No title found]",
            "bill_number": bill_number,
            "parliament_session": session_id,
            "last_updated": status_date.isoformat() if status_date else None,
            "tags": _extract_tag_labels(llm_tags),
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
                "tags": None,
            },
        ))
    return output
