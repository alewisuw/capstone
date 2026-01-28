# User Testing Web Application - Complete Documentation

## 📋 Overview

A lightweight Flask-based web application for conducting user studies comparing two bill recommendation methods:

1. **Fused Embeddings**: Combines user interests with demographic context (80/20 weighted)
2. **Individual Tag Queries**: Uses only user interests, searching separately for each tag

## 📁 File Structure

```
user_tests/
├── app.py                      # Flask backend application
├── requirements.txt            # Python dependencies
├── start.sh                    # Quick start script (executable)
├── test_setup.py              # Setup verification script (executable)
├── README.md                  # Basic setup instructions
├── GUIDE.md                   # Detailed user guide
├── templates/
│   ├── index.html            # Page 1: Profile input form
│   └── compare.html          # Page 2: Bill comparison & rating
└── results/
    └── sample_output.csv     # Example CSV output format
```

## 🎯 Features

### Page 1: Profile Input
- ✅ Dynamic interest tag input
- ✅ Optional demographic fields:
  - Age group (8 options)
  - Gender identity (6 options)
  - Income range (9 options)
  - Disability status (7 options)
- ✅ Form validation
- ✅ Modern, responsive UI

### Page 2: Bill Comparison
- ✅ Side-by-side display of 10 bills (5 per method)
- ✅ Relevant/Non-Relevant buttons for each bill
- ✅ Real-time progress tracking
- ✅ Submit button (enabled when all 10 bills rated)
- ✅ Auto-redirect to Page 1 after submission

### Backend Features
- ✅ RESTful API endpoints
- ✅ Qdrant vector search integration
- ✅ PostgreSQL database queries for bill details
- ✅ CSV export with timestamps
- ✅ Session storage for data persistence
- ✅ Error handling

## 🚀 Quick Start

### Prerequisites
1. Python 3.7+
2. Qdrant running on `localhost:6333`
3. PostgreSQL database with bill data

### Installation

```bash
cd user_tests

# Option 1: Use the start script (recommended)
./start.sh

# Option 2: Manual setup
pip install -r requirements.txt
python app.py
```

### Verification

Run the setup test before first use:
```bash
python test_setup.py
```

This checks:
- All dependencies installed
- Required directories exist
- Qdrant is accessible
- Template files present

## 🔌 API Endpoints

### POST `/api/recommendations`
**Purpose**: Get bill recommendations from both methods

**Request Body**:
```json
{
  "interests": ["healthcare", "education"],
  "demographics": {
    "age_group": "25_34",
    "gender_identity": "woman",
    "income_range": "60000_79999",
    "disability_status": "no_disability"
  }
}
```

**Response**:
```json
{
  "success": true,
  "fused": [
    {
      "bill_id": "C-123",
      "title": "An Act to amend...",
      "summary": "This bill...",
      "score": 0.856
    },
    ...
  ],
  "tag_query": [...]
}
```

### POST `/api/submit`
**Purpose**: Save user ratings to CSV

**Request Body**:
```json
{
  "interests": ["healthcare"],
  "demographics": {...},
  "fused_responses": {
    "C-123": {
      "relevance": "relevant",
      "title": "Bill title"
    },
    ...
  },
  "tag_responses": {...}
}
```

**Response**:
```json
{
  "success": true,
  "filename": "user_tests/results/user_test_20260127_143025.csv"
}
```

## 📊 Data Output

### CSV Format
Each user session creates one CSV file in `results/` directory.

**Filename**: `user_test_YYYYMMDD_HHMMSS.csv`

**Columns**:
- `method`: "fused_embedding" or "tag_query"
- `bill_id`: Bill identifier
- `bill_title`: Full bill title
- `relevance`: "relevant" or "non-relevant"
- `interests`: Comma-separated user interests
- `demographics`: JSON string of demographic data

**Example Row**:
```csv
fused_embedding,C-123,An Act to amend the Healthcare Act,relevant,"healthcare, seniors","{\"age_group\": \"65_plus\"}"
```

## 🔧 Technical Details

### Recommendation Algorithms

#### Fused Embeddings
```python
# 1. Create interest embedding
interest_emb = model.encode(interests).mean(axis=0)

# 2. Create demographic embedding
demographic_terms = generate_context_from_demographics(demographics)
demographic_emb = model.encode(demographic_terms).mean(axis=0)

# 3. Fuse with weights
fused = 0.8 * interest_emb + 0.2 * demographic_emb

# 4. Search Qdrant
results = qdrant.search(query_vector=fused, limit=5)
```

#### Individual Tag Queries
```python
# 1. Search separately for each interest
all_results = []
for tag in interests:
    tag_vector = model.encode(tag)
    results = qdrant.search(query_vector=tag_vector, limit=5)
    all_results.extend(results)

# 2. Deduplicate and rank by score
unique_bills = deduplicate_by_id(all_results)
top_5 = sorted(unique_bills, key=lambda x: -x.score)[:5]
```

### Frontend Technology
- Pure HTML5/CSS3/JavaScript (no frameworks)
- Session Storage for data persistence
- Fetch API for async requests
- Responsive grid layout

### Backend Technology
- Flask (lightweight WSGI framework)
- sentence-transformers (all-MiniLM-L6-v2)
- Qdrant Client (vector search)
- psycopg2 (PostgreSQL)
- boto3 (AWS credentials, optional)

## 📝 Usage Workflow

1. **User opens** `http://localhost:5001`
2. **User enters** interests (required) and demographics (optional)
3. **Click** "Get Bill Recommendations"
4. **System fetches** 5 bills using fused embeddings
5. **System fetches** 5 bills using tag queries
6. **User rates** each of the 10 bills (relevant/non-relevant)
7. **Progress bar** shows completion (0/10 → 10/10)
8. **Click** "Submit Ratings & Start New Test"
9. **System saves** results to timestamped CSV
10. **System redirects** back to Page 1 with clean form

## ⚙️ Configuration

### Database Connection
Edit in [app.py](app.py#L48-L56):
```python
DB_HOST = 'localhost'      # Your PostgreSQL host
DB_PORT = 5432
DB_NAME = 'postgres'
DB_USER = 'postgres'
DB_PASS = 'postgres'
```

### Qdrant Connection
Edit in [app.py](app.py#L59):
```python
qdrant = QdrantClient("localhost", port=6333)
```

### Flask Server
Edit in [app.py](app.py#L225):
```python
app.run(debug=True, port=5001)
```

## 🐛 Troubleshooting

### Port 5001 already in use
```bash
# Find and kill the process
lsof -ti:5001 | xargs kill -9

# Or change the port in app.py
app.run(debug=True, port=5002)
```

### Qdrant connection failed
```bash
# Check if Qdrant is running
curl http://localhost:6333/collections

# Start Qdrant if needed
docker run -p 6333:6333 qdrant/qdrant
```

### Database connection error
- Verify PostgreSQL is running
- Check credentials in app.py
- Ensure database contains bill data

### Import errors
```bash
# Reinstall dependencies
pip install -r requirements.txt --upgrade
```

## 📈 Analytics & Insights

The CSV output enables analysis such as:
- **Method comparison**: Which method has higher relevance rate?
- **Demographic impact**: Does demographic data improve fused method?
- **Interest patterns**: Which interests lead to better matches?
- **User satisfaction**: Overall relevance rates per session

## 🔒 Privacy & Ethics

- No personally identifiable information collected
- All demographics optional
- Data stored locally only
- No external transmission
- Each session independent

## 🤝 Contributing

To extend this application:
1. Add more demographic fields in [index.html](templates/index.html)
2. Implement additional recommendation methods in [app.py](app.py)
3. Enhance CSV output with more metrics
4. Add visualization dashboard for results

## 📄 License

Part of the capstone project. See main repository for license details.

## 🆘 Support

For issues:
1. Run `python test_setup.py` to diagnose
2. Check console logs in browser (F12)
3. Check Flask terminal output
4. Verify Qdrant and PostgreSQL are running
