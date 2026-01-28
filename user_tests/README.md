# User Testing Web Application

This lightweight web application is designed for comparing two bill recommendation methods:
1. **Fused Embeddings**: Combines user interests with demographic information
2. **Individual Tag Queries**: Uses only user interests

## Setup

1. Install dependencies:
```bash
pip install flask sentence-transformers qdrant-client psycopg2-binary boto3
```

2. Ensure Qdrant is running locally on port 6333
3. Ensure PostgreSQL database is accessible

## Running the Application

```bash
cd user_tests
python app.py
```

The application will start on `http://localhost:5001`

## Workflow

1. **Page 1 - Profile Input**: Users enter their interests and optional demographic information
2. **Page 2 - Bill Comparison**: Two columns display 5 bills each from different recommendation methods
3. Users rate each bill as "Relevant" or "Non-Relevant"
4. Clicking "Submit" saves results to CSV and returns to Page 1

## Output

Results are saved in `user_tests/results/` as CSV files with timestamp:
- `user_test_YYYYMMDD_HHMMSS.csv`

Each row contains:
- `method`: "fused_embedding" or "tag_query"
- `bill_id`: The bill identifier
- `bill_title`: Bill title
- `relevance`: "relevant" or "non-relevant"
- `interests`: Comma-separated user interests
- `demographics`: JSON string of demographic data
