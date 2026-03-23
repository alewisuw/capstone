import json
import os
import boto3
import psycopg2
import unicodedata
import re

# ── AWS / DB connection ────────────────────────────────────────────────────────

ssm = boto3.client('ssm', region_name='ca-central-1')
PARAMETER_NAMES = [
    '/billBoard/DB_HOST',
    '/billBoard/DB_PASSWORD',
]

def get_parameters(names, with_decryption=True):
    response = ssm.get_parameters(Names=names, WithDecryption=with_decryption)
    parameters = {p['Name']: p['Value'] for p in response['Parameters']}
    if response['InvalidParameters']:
        print(f"WARNING: Missing SSM parameters: {response['InvalidParameters']}")
    return parameters

creds = get_parameters(PARAMETER_NAMES)
PG_CONFIG = {
    "dbname": "postgres",
    "user":   "postgres",
    "password": creds['/billBoard/DB_PASSWORD'],
    "host":   creds['/billBoard/DB_HOST'],
    "port":   5432,
}

# ── Paths ──────────────────────────────────────────────────────────────────────

INPUT_PATH  = os.path.join(os.path.dirname(__file__), '../mobile/src/data/federalDistricts2023.json')
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), '../mobile/src/data/federalDistricts2023_fixed.json')

# ── Name normalisation (strips accents, punctuation, case) ────────────────────

def normalise(s: str) -> str:
    """Lower-case, remove accents, collapse whitespace and punctuation."""
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')  # drop combining marks
    s = s.lower()
    s = re.sub(r'[^a-z0-9 ]', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    # 1. Load GeoJSON
    with open(INPUT_PATH, 'r', encoding='utf-8') as f:
        geojson = json.load(f)
    print(f"Loaded {len(geojson['features'])} features from {INPUT_PATH}")

    # 2. Fetch authoritative riding data from DB
    conn   = psycopg2.connect(**PG_CONFIG)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT name_en, name_fr, edid
        FROM public.core_riding
        WHERE current = true
        ORDER BY name_en ASC, id ASC
    """)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    print(f"Fetched {len(rows)} current ridings from database")

    # 3. Build lookup: normalised name → (original name, edid)
    #    We index both English and French names so we catch either variant.
    lookup: dict[str, tuple[str, int]] = {}
    for name_en, name_fr, edid in rows:
        for name in (name_en, name_fr):
            if name:
                key = normalise(name)
                if key in lookup and lookup[key][1] != edid:
                    print(f"WARNING: Duplicate normalised key '{key}' for different edids "
                          f"({lookup[key][1]} vs {edid}) — keeping first")
                else:
                    lookup[key] = (name, edid)

    # 4. Walk features and patch IDs
    fixed = skipped = already_ok = 0

    for feature in geojson['features']:
        props = feature.get('properties', {})
        geo_name  = props.get('name') or props.get('ED_NAMEF') or ''
        old_id    = props.get('id')
        norm_name = normalise(geo_name)

        if norm_name not in lookup:
            print(f"WARNING: No DB match for '{geo_name}' (normalised: '{norm_name}') — skipping")
            skipped += 1
            continue

        _, correct_id = lookup[norm_name]

        if old_id == correct_id:
            already_ok += 1
        else:
            print(f"  Fixing '{geo_name}': {old_id} → {correct_id}")
            props['id'] = correct_id
            fixed += 1

    # 5. Write corrected GeoJSON
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(geojson, f, ensure_ascii=False, separators=(',', ':'), indent=2)

    print(f"\nDone. Fixed: {fixed}  |  Already correct: {already_ok}  |  Skipped (no match): {skipped}")
    print(f"Output written to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()