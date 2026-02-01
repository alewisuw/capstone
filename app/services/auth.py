from functools import lru_cache
from typing import Dict

import requests
from jose import jwt
from jose.exceptions import JWTError
import boto3

from app.config.settings import settings


class AuthError(Exception):
    pass


@lru_cache
def _jwks() -> Dict:
    region = settings["auth"]["cognito_region"]
    user_pool_id = settings["auth"]["user_pool_id"]
    if not region or not user_pool_id:
        raise AuthError("Cognito configuration is missing")

    url = f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json"
    response = requests.get(url, timeout=5)
    response.raise_for_status()
    return response.json()


def verify_id_token(token: str) -> Dict:
    jwks = _jwks()
    region = settings["auth"]["cognito_region"]
    user_pool_id = settings["auth"]["user_pool_id"]
    client_id = settings["auth"]["app_client_id"]
    if not client_id:
        raise AuthError("Cognito app client id is missing")

    issuer = f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}"
    try:
        return jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            issuer=issuer,
            audience=client_id,
        )
    except JWTError as exc:
        raise AuthError("Invalid token") from exc

def delete_cognito_user(username: str) -> None:
    region = settings["auth"]["cognito_region"]
    user_pool_id = settings["auth"]["user_pool_id"]
    if not region or not user_pool_id:
        raise AuthError("Cognito configuration is missing")
    client = boto3.client("cognito-idp", region_name=region)
    client.admin_delete_user(UserPoolId=user_pool_id, Username=username)
