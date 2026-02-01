from typing import Dict, Optional
import boto3
import os

from app.config.settings import settings

# Get AWS region from environment or default to ca-central-1
AWS_REGION = os.getenv("AWS_REGION", "ca-central-1")


def _table():
    table_name = settings["dynamodb"]["table"]
    return boto3.resource("dynamodb", region_name=AWS_REGION).Table(table_name)


def get_profile(user_id: str) -> Optional[Dict]:
    response = _table().get_item(Key={"user_id": user_id})
    return response.get("Item")


def upsert_profile(user_id: str, data: Dict) -> Dict:
    payload = {"user_id": user_id, **data}
    _table().put_item(Item=payload)
    return payload

def delete_profile(user_id: str) -> None:
    _table().delete_item(Key={"user_id": user_id})
