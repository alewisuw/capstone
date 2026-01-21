from fastapi import APIRouter, HTTPException
import psycopg2

from app.config.settings import DB_CFG
from app.services.qdrant import get_qdrant

router = APIRouter()

@router.get("/health")
def health():
    checks = {}

    try:
        conn = psycopg2.connect(connect_timeout=2, **DB_CFG)
        cur = conn.cursor()
        cur.execute("SELECT 1;")
        cur.fetchone()
        cur.close()
        conn.close()
        checks["database"] = {"ok": True}
    except Exception as exc:
        checks["database"] = {"ok": False, "error": str(exc)}

    try:
        client = get_qdrant()
        client.get_collections()
        checks["qdrant"] = {"ok": True}
    except Exception as exc:
        checks["qdrant"] = {"ok": False, "error": str(exc)}

    ok = all(item["ok"] for item in checks.values())
    payload = {"status": "ok" if ok else "degraded", "checks": checks}
    if not ok:
        raise HTTPException(status_code=503, detail=payload)
    return payload
