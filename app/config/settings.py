import os
import boto3
from functools import lru_cache

AWS_REGION = os.getenv("AWS_REGION", "ca-central-1")

PARAMETER_NAMES = [
    "/billBoard/DB_HOST",
    "/billBoard/DB_PASSWORD",
]

def _ssm_enabled() -> bool:
    return os.getenv("AWS_SSM_ENABLED", "").lower() in {"1", "true", "yes"}

def _load_ssm_parameters():
    if not _ssm_enabled():
        return {}

    try:
        os.environ.setdefault("AWS_EC2_METADATA_DISABLED", "true")
        ssm = boto3.client("ssm", region_name=AWS_REGION)
        response = ssm.get_parameters(
            Names=PARAMETER_NAMES,
            WithDecryption=True,
        )
        return {p["Name"]: p["Value"] for p in response["Parameters"]}
    except Exception:
        return {}

@lru_cache
def get_settings():
    ssm_params = _load_ssm_parameters()

    return {
        "db": {
            "host": ssm_params.get("/billBoard/DB_HOST", "localhost"),
            "port": int(os.getenv("DB_PORT", 5432)),
            "name": os.getenv("DB_NAME", "billsdb"),
            "user": os.getenv("DB_USER", "postgres"),
            "password": ssm_params.get("/billBoard/DB_PASSWORD", "postgres"),
        },
        "qdrant": {
            "host": os.getenv("QDRANT_HOST", "localhost"),
            "port": int(os.getenv("QDRANT_PORT", 6333)),
        },
        "collections": {
            "bill_embeddings": "bill_text_embeddings",
        },
        "paths": {
            "profiles": os.path.join(
                os.path.dirname(__file__), "..", "..", "retrieval", "profiles"
            ),
        },
    }

settings = get_settings()

DB_CFG = {
    "host": settings["db"]["host"],
    "port": settings["db"]["port"],
    "dbname": settings["db"]["name"],
    "user": settings["db"]["user"],
    "password": settings["db"]["password"],
}
