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
            SELECT bt.llm_summary, bt.summary_en, b.name_en, b.number, b.session_id, b.status_date, bt.llm_tags, b.status_code, bt.is_new_bill
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
    status_code = row[7]
    is_new_bill = row[8]
    return {
        "summary": summary,
        "title": title,
        "bill_number": bill_number,
        "parliament_session": session_id,
        "last_updated": status_date.isoformat() if status_date else None,
        "tags": tags,
        "status_code": status_code,
        "is_new_bill": is_new_bill,
    }

def get_bills_info(bill_ids: List[int]) -> List[Dict]:
    if not bill_ids:
        return []

    unique_ids = list(dict.fromkeys(int(bill_id) for bill_id in bill_ids))
    try:
        conn = psycopg2.connect(**DB_CFG)
        cur = conn.cursor()
        cur.execute("""
            SELECT bt.bill_id, bt.llm_summary, bt.summary_en, b.name_en, b.number, b.session_id, b.status_date, bt.llm_tags, b.status_code, bt.is_new_bill
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
        bill_id, llm_summary, summary_en, title, bill_number, session_id, status_date, llm_tags, status_code, is_new_bill = row
        summary = llm_summary or summary_en or "[No summary found]"
        info_map[bill_id] = {
            "bill_id": bill_id,
            "summary": summary,
            "title": title or "[No title found]",
            "bill_number": bill_number,
            "parliament_session": session_id,
            "last_updated": status_date.isoformat() if status_date else None,
            "tags": _extract_tag_labels(llm_tags),
            "status_code": status_code,
            "is_new_bill": is_new_bill,
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
                "status_code": None,
                "is_new_bill": None,
            },
        ))
    return output


def get_district_mp_vote(bill_id: int, electoral_district_id: str) -> Optional[Dict]:
    if not electoral_district_id:
        return None

    try:
        district_id = int(electoral_district_id)
    except (TypeError, ValueError):
        return None

    try:
        conn = psycopg2.connect(**DB_CFG)
        cur = conn.cursor()

        # Resolve the requested district to known riding rows.
        cur.execute(
            """
            SELECT id, name_en
            FROM core_riding
            WHERE id = %s OR edid = %s
            ORDER BY current DESC, id DESC;
            """,
            (district_id, district_id),
        )
        ridings = cur.fetchall()
        riding_ids = [row[0] for row in ridings]
        district_name = ridings[0][1] if ridings else None
        if not riding_ids:
            cur.close()
            conn.close()
            return None

        # Preferred path: use the recorded elected-member row for the vote.
        cur.execute(
            """
            SELECT
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
            WHERE vq.bill_id = %s
              AND em.riding_id = ANY(%s)
            ORDER BY vq.date DESC NULLS LAST, vq.id DESC
            LIMIT 1;
            """,
            (bill_id, riding_ids),
        )
        row = cur.fetchone()

        # Fallback path: match via politician and district membership at vote date.
        if not row:
            cur.execute(
                """
                SELECT
                    mv.vote,
                    vq.date,
                    vq.result,
                    p.name,
                    party.short_name_en,
                    r.name_en
                FROM bills_votequestion vq
                JOIN bills_membervote mv ON mv.votequestion_id = vq.id
                JOIN core_electedmember em
                  ON em.politician_id = mv.politician_id
                 AND em.riding_id = ANY(%s)
                 AND (em.start_date IS NULL OR em.start_date <= vq.date)
                 AND (em.end_date IS NULL OR em.end_date >= vq.date)
                LEFT JOIN core_politician p ON p.id = mv.politician_id
                LEFT JOIN core_party party ON party.id = em.party_id
                LEFT JOIN core_riding r ON r.id = em.riding_id
                WHERE vq.bill_id = %s
                ORDER BY vq.date DESC NULLS LAST, vq.id DESC
                LIMIT 1;
                """,
                (riding_ids, bill_id),
            )
            row = cur.fetchone()

        cur.close()
        conn.close()
    except Exception as exc:
        print(f"[DB error] get_district_mp_vote failed for bill_id={bill_id}: {exc}")
        return None

    if not row:
        return None

    vote, vote_date, vote_result, mp_name, mp_party, district_name_from_vote = row
    vote_normalized = (vote or "").strip().lower()
    position = None
    if vote_normalized in {"y", "yea", "yes", "for"}:
        position = "for"
    elif vote_normalized in {"n", "nay", "no", "against"}:
        position = "against"
    elif vote_normalized in {"a", "p", "paired", "abstain", "abstained"}:
        position = "abstain"

    return {
        "bill_id": bill_id,
        "electoral_district": district_name_from_vote or district_name,
        "electoral_district_id": str(district_id),
        "available": True,
        "mp_name": mp_name,
        "mp_party": mp_party,
        "vote": vote,
        "position": position,
        "vote_date": vote_date.isoformat() if vote_date else None,
        "vote_result": vote_result,
    }
