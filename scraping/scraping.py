"""
Scrapes bills from the Open Parliament API (https://api.openparliament.ca/bills/)
and upserts them into both the bills_billtext and bills_billtext_copy tables.

Usage:
    python scraping/scraping.py                        # scrape all sessions
    python scraping/scraping.py --session 45-1         # scrape a specific session
    python scraping/scraping.py --since 2025-10-01     # scrape bills introduced on or after a date
    python scraping/scraping.py --session 44-1 --limit 5  # scrape with a cap
"""

import argparse
import re
import sys
import time
from datetime import datetime, timezone

import psycopg2
import requests
from bs4 import BeautifulSoup

sys.path.insert(0, ".")
from app.config.settings import DB_CFG

# ── constants ────────────────────────────────────────────────────────────────
API_BASE = "https://api.openparliament.ca"
PARL_VIEWER = "https://www.parl.ca/DocumentViewer"

HEADERS = {
    "Accept": "application/json",
    "API-Version": "v1",
    "User-Agent": "BillBoard-Capstone (contact: billboard@example.com)",
}

REQUEST_DELAY = 0.5  # seconds between API calls to respect rate limits


# ── API helpers ──────────────────────────────────────────────────────────────
def fetch_json(url: str, params: dict | None = None) -> dict:
    """GET a JSON resource, retrying once on 429."""
    full_url = url if url.startswith("http") else f"{API_BASE}{url}"
    for attempt in range(3):
        resp = requests.get(full_url, headers=HEADERS, params=params, timeout=30)
        if resp.status_code == 429:
            wait = int(resp.headers.get("Retry-After", 5))
            print(f"  ⏳ Rate-limited, waiting {wait}s …")
            time.sleep(wait)
            continue
        resp.raise_for_status()
        return resp.json()
    raise RuntimeError(f"Failed to fetch {full_url} after retries")


def iter_bills(session: str | None = None):
    """Yield every bill object from the paginated /bills/ endpoint."""
    params: dict = {}
    if session:
        params["session"] = session

    url = "/bills/"
    while url:
        data = fetch_json(url, params)
        yield from data.get("objects", [])
        url = data.get("pagination", {}).get("next_url")
        params = {}  # next_url already contains query params
        time.sleep(REQUEST_DELAY)


def fetch_bill_detail(bill_url: str) -> dict:
    """Return the full detail dict for a single bill."""
    time.sleep(REQUEST_DELAY)
    return fetch_json(bill_url)


# ── parl.ca scraping ────────────────────────────────────────────────────────
def scrape_bill_page(doc_id: int, lang: str = "en") -> str | None:
    """Download the HTML for a bill from the parl.ca DocumentViewer."""
    url = f"{PARL_VIEWER}/{lang}/{doc_id}"
    try:
        resp = requests.get(url, timeout=60, headers={
            "User-Agent": "BillBoard-Capstone (contact: billboard@example.com)"
        })
        if resp.status_code != 200:
            print(f"  ⚠  DocumentViewer returned {resp.status_code} for {url}")
            return None
        return resp.text
    except requests.RequestException as exc:
        print(f"  ⚠  Failed to fetch {url}: {exc}")
        return None


def extract_text_from_html(html: str) -> str:
    """Extract readable text from a DocumentViewer page."""
    soup = BeautifulSoup(html, "lxml")
    # The bill text lives inside the main content area
    content = soup.select_one("#TextContent, #divText, .bill-text, .publication-content")
    if content:
        return content.get_text(separator="\n", strip=True)
    # Fallback: grab the body
    body = soup.body
    if body:
        # Remove nav / header / footer noise
        for tag in body.select("nav, header, footer, script, style, .sidebar"):
            tag.decompose()
        return body.get_text(separator="\n", strip=True)
    return ""


def extract_summary(html: str) -> str:
    """Pull the SUMMARY section from the DocumentViewer HTML."""
    soup = BeautifulSoup(html, "lxml")
    # Look for a heading containing "SUMMARY"
    for heading in soup.find_all(re.compile(r"^h[1-4]$", re.I)):
        if "summary" in (heading.get_text() or "").lower().strip():
            parts: list[str] = []
            for sibling in heading.find_next_siblings():
                # Stop at the next heading of equal or higher level
                if sibling.name and re.match(r"^h[1-4]$", sibling.name, re.I):
                    break
                text = sibling.get_text(separator=" ", strip=True)
                if text:
                    parts.append(text)
            return "\n".join(parts)
    return ""


def extract_doc_id(text_url: str | None) -> int | None:
    """Extract the numeric doc ID from a parl.ca DocumentViewer URL."""
    if not text_url:
        return None
    m = re.search(r"/(\d+)\s*$", text_url)
    return int(m.group(1)) if m else None


# ── DB helpers ───────────────────────────────────────────────────────────────
def ensure_session(cur, session_id: str):
    """Create a core_session row if it doesn't already exist."""
    cur.execute("SELECT 1 FROM core_session WHERE id = %s", (session_id,))
    if cur.fetchone():
        return
    # Parse "45-1" → parliament=45, sessnum=1
    parts = session_id.split("-")
    pnum = int(parts[0]) if parts[0].isdigit() else None
    snum = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else None
    ordinal = {1: "st", 2: "nd", 3: "rd"}.get(pnum % 10, "th") if pnum else ""
    name = f"{pnum}{ordinal} Parliament, session {snum}" if pnum else session_id
    cur.execute(
        """
        INSERT INTO core_session (id, name, start, parliamentnum, sessnum)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (session_id, name, datetime.now(timezone.utc).date(), pnum, snum),
    )
    print(f"  ✚ Created core_session '{session_id}'")


def get_or_create_bill(cur, detail: dict) -> int | None:
    """
    Look up a bills_bill row by legisinfo_id. Create one if it doesn't exist.
    Returns the bills_bill.id.
    """
    legisinfo_id = detail.get("legisinfo_id")
    if not legisinfo_id:
        return None

    cur.execute("SELECT id FROM bills_bill WHERE legisinfo_id = %s", (legisinfo_id,))
    row = cur.fetchone()
    if row:
        return row[0]

    # Need to insert a new bills_bill record
    name_en = (detail.get("name") or {}).get("en", "")
    name_fr = (detail.get("name") or {}).get("fr", "")
    number = detail.get("number", "")
    number_only = int(re.sub(r"\D", "", number)) if re.search(r"\d", number) else 0
    session_id = detail.get("session", "")
    introduced = detail.get("introduced")
    law = detail.get("law")
    private_member = detail.get("private_member_bill")
    status_code = detail.get("status_code", "")
    short_en = (detail.get("short_title") or {}).get("en", "")
    short_fr = (detail.get("short_title") or {}).get("fr", "")
    home = detail.get("home_chamber", "")
    institution = home[0].upper() if home else "C"  # C = Commons, S = Senate
    text_docid = extract_doc_id(detail.get("text_url"))

    # Ensure the session FK target exists
    ensure_session(cur, session_id)

    status_date = introduced  # use introduced date as initial status_date

    cur.execute(
        """
        INSERT INTO bills_bill
            (name_en, name_fr, number, number_only,
             legisinfo_id, session_id, introduced, law,
             privatemember, status_code, institution,
             short_title_en, short_title_fr, text_docid,
             added, library_summary_available, status_date)
        VALUES (%s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s)
        RETURNING id
        """,
        (
            name_en, name_fr, number, number_only,
            legisinfo_id, session_id, introduced, law,
            private_member, status_code, institution,
            short_en, short_fr, text_docid,
            datetime.now(timezone.utc).date(), False, status_date,
        ),
    )
    new_id = cur.fetchone()[0]
    print(f"  ✚ Created bills_bill id={new_id} for {session_id}/{number}")
    return new_id


def upsert_billtext(
    cur,
    bill_id: int,
    doc_id: int,
    created: datetime,
    text_en: str,
    text_fr: str,
    summary_en: str,
):
    """Insert or update a row in bills_billtext_copy keyed on (bill_id, docid)."""
    cur.execute(
        "SELECT id FROM bills_billtext_copy WHERE bill_id = %s AND docid = %s",
        (bill_id, doc_id),
    )
    existing = cur.fetchone()

    if existing:
        cur.execute(
            """
            UPDATE bills_billtext_copy
               SET text_en     = %s,
                   text_fr     = %s,
                   summary_en  = %s,
                   created     = %s
             WHERE id = %s
            """,
            (text_en, text_fr, summary_en, created, existing[0]),
        )
        print(f"    ↻ Updated billtext id={existing[0]}")
    else:
        cur.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM bills_billtext_copy")
        new_id = cur.fetchone()[0]
        cur.execute(
            """
            INSERT INTO bills_billtext_copy
                (id, bill_id, docid, created, text_en, text_fr, summary_en)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (new_id, bill_id, doc_id, created, text_en, text_fr, summary_en),
        )
        print(f"    ✚ Inserted billtext_copy id={new_id}")


def upsert_billtext_main(
    cur,
    bill_id: int,
    doc_id: int,
    created: datetime,
    text_en: str,
    text_fr: str,
    summary_en: str,
):
    """Insert or update a row in bills_billtext (main table).

    First match by docid (canonical). If no docid match exists, fall back to
    an exact text_en match to avoid duplicate bill text rows.
    """
    cur.execute(
        "SELECT id, bill_id FROM bills_billtext WHERE docid = %s",
        (doc_id,),
    )
    existing = cur.fetchone()

    if existing:
        existing_id = existing[0]
        cur.execute(
            """
            UPDATE bills_billtext
               SET bill_id     = %s,
                   docid       = %s,
                   text_en     = %s,
                   text_fr     = %s,
                   summary_en  = %s,
                   created     = %s
             WHERE id = %s
            """,
            (bill_id, doc_id, text_en, text_fr, summary_en, created, existing_id),
        )
        print(f"    ↻ Updated billtext (main) id={existing_id}")
    else:
        # If this exact bill text already exists under a different docid/bill,
        # update that row instead of inserting a duplicate body of text.
        dup_by_text = None
        if text_en:
            cur.execute(
                "SELECT id FROM bills_billtext WHERE text_en = %s LIMIT 1",
                (text_en,),
            )
            dup_by_text = cur.fetchone()

        if dup_by_text:
            existing_id = dup_by_text[0]
            cur.execute(
                """
                UPDATE bills_billtext
                   SET bill_id     = %s,
                       docid       = %s,
                       text_en     = %s,
                       text_fr     = %s,
                       summary_en  = %s,
                       created     = %s
                 WHERE id = %s
                """,
                (bill_id, doc_id, text_en, text_fr, summary_en, created, existing_id),
            )
            print(f"    ↻ Reused duplicate text row in main id={existing_id}")
            return

        cur.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM bills_billtext")
        new_id = cur.fetchone()[0]
        cur.execute(
            """
            INSERT INTO bills_billtext
                (id, bill_id, docid, created, text_en, text_fr, summary_en)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (new_id, bill_id, doc_id, created, text_en, text_fr, summary_en),
        )
        print(f"    ✚ Inserted billtext (main) id={new_id}")


# ── main ─────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="Scrape bills from Open Parliament and upsert into DB"
    )
    parser.add_argument("--session", help="Parliament session, e.g. 45-1")
    parser.add_argument(
        "--since", type=str, default=None,
        help="Only process bills introduced on or after this date (YYYY-MM-DD)"
    )
    parser.add_argument(
        "--limit", type=int, default=0,
        help="Max number of bills to process (0 = all)"
    )
    args = parser.parse_args()

    since_date = (
        datetime.strptime(args.since, "%Y-%m-%d").date() if args.since else None
    )

    conn = psycopg2.connect(**DB_CFG)
    conn.autocommit = False
    cur = conn.cursor()

    # Sync sequences to avoid duplicate key errors
    cur.execute("SELECT setval('bills_bill_id_seq', (SELECT COALESCE(MAX(id), 1) FROM bills_bill))")
    cur.execute("""
        DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'bills_billtext_id_seq') THEN
                PERFORM setval('bills_billtext_id_seq', (SELECT COALESCE(MAX(id), 1) FROM bills_billtext));
            END IF;
        END $$;
    """)
    conn.commit()

    processed = 0
    skipped = 0
    errors = 0

    filters = []
    if args.session:
        filters.append(f"session {args.session}")
    if since_date:
        filters.append(f"since {since_date}")
    filter_str = f" ({', '.join(filters)})" if filters else ""
    print(f"🔍 Fetching bills from Open Parliament API{filter_str} …\n")

    for bill_summary in iter_bills(session=args.session):
        if args.limit and processed >= args.limit:
            break

        bill_url = bill_summary.get("url")
        number = bill_summary.get("number", "?")
        session = bill_summary.get("session", "?")
        label = f"{session}/{number}"

        # ── date filter ──────────────────────────────────────────────────
        if since_date:
            introduced_str = bill_summary.get("introduced")
            if introduced_str:
                intro = datetime.strptime(introduced_str, "%Y-%m-%d").date()
                if intro < since_date:
                    continue
            else:
                # No introduced date available — skip to be safe
                continue

        print(f"[{processed + 1}] {label}")

        # ── fetch detail ─────────────────────────────────────────────────
        try:
            detail = fetch_bill_detail(bill_url)
        except Exception as exc:
            print(f"  ⚠  Could not fetch detail for {label}: {exc}")
            errors += 1
            continue

        # ── extract doc_id from text_url ─────────────────────────────────
        text_url = detail.get("text_url")
        doc_id = extract_doc_id(text_url)
        if not doc_id:
            print(f"  ⚠  No text_url / doc ID for {label}, skipping")
            skipped += 1
            continue

        # ── look up or create bills_bill record ──────────────────────────
        try:
            bill_id = get_or_create_bill(cur, detail)
        except Exception as exc:
            print(f"  ⚠  DB error looking up bill for {label}: {exc}")
            conn.rollback()
            errors += 1
            continue

        if not bill_id:
            print(f"  ⚠  No legisinfo_id for {label}, skipping")
            skipped += 1
            continue

        # ── skip if already present in both tables ────────────────────
        cur.execute(
            "SELECT 1 FROM bills_billtext_copy WHERE bill_id = %s AND docid = %s",
            (bill_id, doc_id),
        )
        in_copy = cur.fetchone()
        cur.execute(
            "SELECT 1 FROM bills_billtext WHERE docid = %s",
            (doc_id,),
        )
        in_main = cur.fetchone()
        if in_copy and in_main:
            print(f"  ⏩ Already exists in both tables, skipping")
            skipped += 1
            processed += 1
            continue

        # ── scrape bill text from parl.ca ────────────────────────────────
        print(f"  📄 Scraping doc {doc_id} …")
        html_en = scrape_bill_page(doc_id, lang="en")
        time.sleep(REQUEST_DELAY)
        html_fr = scrape_bill_page(doc_id, lang="fr")

        text_en = extract_text_from_html(html_en) if html_en else ""
        text_fr = extract_text_from_html(html_fr) if html_fr else ""
        summary_en = extract_summary(html_en) if html_en else ""

        introduced = detail.get("introduced")
        created = (
            datetime.fromisoformat(introduced).replace(tzinfo=timezone.utc)
            if introduced
            else datetime.now(timezone.utc)
        )

        # ── upsert into both tables ─────────────────────────────────────
        try:
            upsert_billtext(cur, bill_id, doc_id, created, text_en, text_fr, summary_en)
            upsert_billtext_main(cur, bill_id, doc_id, created, text_en, text_fr, summary_en)
            conn.commit()
        except Exception as exc:
            print(f"  ⚠  DB error upserting {label}: {exc}")
            conn.rollback()
            errors += 1
            continue

        processed += 1

    cur.close()
    conn.close()

    print(f"\n✅ Done — processed: {processed}, skipped: {skipped}, errors: {errors}")


if __name__ == "__main__":
    main()
