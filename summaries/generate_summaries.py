import json
import boto3
import psycopg2
import requests
from google.oauth2 import service_account
import google.auth.transport.requests

#CURRENTLY SET TO FLASH 2.0, CAN CHANGE AS NEEDED
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

ssm = boto3.client('ssm', region_name='ca-central-1')

PARAMETER_NAMES = [
    '/billBoard/GEMINI_API_KEY',
    '/billBoard/DB_HOST',
    '/billBoard/DB_PASSWORD',
    '/billBoard/SERVICE_ACCOUNT_JSON'
]

def get_parameters(names, with_decryption=True):
    """
    Fetch parameters from AWS Systems Manager Parameter Store.

    Args:
        names (list): List of parameter names to fetch.
        with_decryption (bool): Whether to decrypt secure string parameters. (Always set to true)

    Returns:
        dict: A dictionary mapping parameter names to their corresponding values.
    """

    response = ssm.get_parameters(
        Names=names,
        WithDecryption=with_decryption
    )
    
    parameters = {param['Name']: param['Value'] for param in response['Parameters']}
    
    # Optional: Check if any were invalid/missing
    if response['InvalidParameters']:
        print(f"Missing parameters: {response['InvalidParameters']}")

    return parameters

creds = get_parameters(PARAMETER_NAMES)

# Assign to variables
GEMINI_API_KEY = creds['/billBoard/GEMINI_API_KEY']
DB_HOST = creds['/billBoard/DB_HOST']
DB_PORT = 5432
DB_NAME = 'postgres'
DB_USER = 'postgres'
DB_PASS = creds['/billBoard/DB_PASSWORD']
SERVICE_ACCOUNT_JSON = creds['/billBoard/SERVICE_ACCOUNT_JSON']


def get_token():

    service_account_info = json.loads(SERVICE_ACCOUNT_JSON)


    # Load the service account credentials with the Gemini scope
    creds = service_account.Credentials.from_service_account_info(
        service_account_info,
        scopes=["https://www.googleapis.com/auth/generative-language"]
    )

    creds.refresh(google.auth.transport.requests.Request())
    token = creds.token

    # Return the bearer token as a string
    return token

def summarize(text, token, length='full'):
    """
    Generate a summary of the provided legal bill text using the Gemini API (Flash 2.0).

    Args:
        text (str): The full text of the bill to summarize.
        token (str): Bearer token for Gemini API authorization.
        length (str): Type of summary ('full' or 'short').

    Returns:
        str: The generated summary text.
    """

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    prompt_text = (
        f"Summarize this legal bill text into an unbiased, "
        f"{'detailed' if length == 'full' else 'short and concise'} summary:\n\n{text[:12000]} in an easy to understand and digestable format"
    )
    
    payload = {
    "contents": [
        {
            "parts": [
                {"text": prompt_text}
            ]
        }
    ]
    }

    
    response = requests.post(GEMINI_URL, json=payload, headers=headers)
    # Debugging
    # print(response.status_code)
    # print(response.json())

    response.raise_for_status()
    result = response.json()
    print("\n ---RESULT JSON---", result, "\n")
    return result["candidates"][0]["content"]["parts"][0]["text"]


def main():
    """
    Main entry point for the script:
    - Retrieves credentials and token
    - Connects to PostgreSQL DB
    - Fetches legal bill texts
    - Generates both long and short summaries using Gemini
    - Prints summaries and optionally stores them

    Returns:
        dict: Summary result including status and number of summarized bills.
    """

    # Retrieve token from google serviced account
    token = get_token()

    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )
    cursor = conn.cursor()

    # select bills
    cursor.execute("""
        SELECT bill_id, text_en FROM bills_billtext
        LIMIT 2
    """)
    bills = cursor.fetchall()

    results = []

    for bill_id, full_text in bills:
        try:
            full_summary = summarize(full_text, token, length='full')
            short_summary = summarize(full_text, token, length='short')
            print(f"--- Bill ID: {bill_id} ---")
            print("Full Summary:\n", full_summary)
            print("Short Summary:\n", short_summary)
            print("\n\n")
            results.append({
                "bill_id": bill_id,
                "full_summary": full_summary,
                "short_summary": short_summary
            })

            # Optional: Insert summaries back into DB (commented out for testing -- added in once we find out best path forward for storage)
            # cursor.execute("""
            #     INSERT INTO bill_summaries (bill_id, full_summary, short_summary)
            #     VALUES (%s, %s, %s)
            # """, (bill_id, full_summary, short_summary))
            # conn.commit()
        except Exception as e:
            print(f"Error summarizing bill {bill_id}: {e}")
            conn.rollback()

    cursor.close()
    conn.close()

    return {"status": "tested", "summarized_count": len(results)}

if __name__ == "__main__":
    response = main()
    print("Response:", response)


# ALSO SHOULD TAG FOR EASY RECCOMENDATIONS LATER