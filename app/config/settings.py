import os
import boto3
from functools import lru_cache

AWS_REGION = os.getenv("AWS_REGION", "ca-central-1")

PARAMETER_NAMES = [
    "/billBoard/DB_HOST",
    "/billBoard/DB_PASSWORD",
    "/billBoard/COGNITO_USER_POOL_ID",
    "/billBoard/COGNITO_APP_CLIENT_ID",
]

def _ssm_enabled() -> bool:
    return os.getenv("AWS_SSM_ENABLED", "true").lower() in {"1", "true", "yes"}

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
            "port": 5432,
            "name": "postgres",
            "user": "postgres",
            "password": ssm_params.get("/billBoard/DB_PASSWORD", "postgres"),
        },
        "qdrant": {
            "host": os.getenv("QDRANT_HOST", "localhost"),
            "port": 6333
        },
        "collections": {
            "bill_embeddings": "bill_text_embeddings",
        },
        "auth": {
            "cognito_region": AWS_REGION,
            "user_pool_id": ssm_params.get("/billBoard/COGNITO_USER_POOL_ID", ""),
            "app_client_id":  ssm_params.get("/billBoard/COGNITO_APP_CLIENT_ID", ""),
        },
        "dynamodb": {
            "table": "user_data",
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
