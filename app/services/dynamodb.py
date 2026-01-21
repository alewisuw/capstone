from typing import Dict, Optional
import boto3

from app.config.settings import settings


def _table():
    table_name = settings["dynamodb"]["table"]
    return boto3.resource("dynamodb").Table(table_name)


def get_profile(user_id: str) -> Optional[Dict]:
    response = _table().get_item(Key={"user_id": user_id})
    return response.get("Item")


def upsert_profile(user_id: str, data: Dict) -> Dict:
    payload = {"user_id": user_id, **data}
    _table().put_item(Item=payload)
    return payload
