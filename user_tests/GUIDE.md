# User Testing Application - Quick Guide

## Overview
This application compares two bill recommendation methods by having users rate bills from each method.

## Application Flow

```
┌─────────────────────────────────────┐
│   Page 1: Profile Input             │
│                                     │
│   - Enter interests (tags)          │
│   - Optional demographics:          │
│     • Age group                     │
│     • Gender identity               │
│     • Income range                  │
│     • Disability status             │
│                                     │
│   [Get Bill Recommendations]        │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│   Page 2: Bill Comparison           │
│                                     │
│   Left Column          Right Column │
│   ┌──────────┐        ┌──────────┐ │
│   │ Fused    │        │ Tag      │ │
│   │ Embedding│        │ Queries  │ │
│   │          │        │          │ │
│   │ Bill 1   │        │ Bill 1   │ │
│   │ ✓ ✗      │        │ ✓ ✗      │ │
│   │          │        │          │ │
│   │ Bill 2   │        │ Bill 2   │ │
│   │ ✓ ✗      │        │ ✓ ✗      │ │
│   │          │        │          │ │
│   │ ... (5)  │        │ ... (5)  │ │
│   └──────────┘        └──────────┘ │
│                                     │
│   Progress: 0 of 10 bills rated     │
│                                     │
│   [Submit Ratings & Start New Test] │
└─────────────────┬───────────────────┘
                  │
                  ▼
          CSV File Saved
                  │
                  ▼
         Back to Page 1
```

## Recommendation Methods

### 1. Fused Embeddings (Left Column)
- **Input**: User interests + demographics
- **Process**: Creates a combined embedding vector using:
  - 80% weight on interests
  - 20% weight on demographic context
- **Goal**: Test if demographic information improves relevance

### 2. Individual Tag Queries (Right Column)
- **Input**: User interests only
- **Process**: 
  - Searches separately for each interest tag
  - Aggregates and deduplicates results
  - Ranks by highest scores
- **Goal**: Baseline method using only explicit interests

## Data Collection

Each user session generates one CSV file containing:
- 10 rows total (5 fused + 5 tag query bills)
- User's relevance rating for each bill
- User's interests and demographics
- Bill ID and title for analysis

## Starting the Application

### Option 1: Using the start script
```bash
cd user_tests
./start.sh
```

### Option 2: Manual start
```bash
cd user_tests
pip install -r requirements.txt
python app.py
```

Then open: `http://localhost:5001`

## Prerequisites

- **Qdrant**: Running on `localhost:6333`
- **PostgreSQL**: Database accessible with bill data
- **Python 3.7+**: With pip installed

## Output Files

Location: `user_tests/results/`
Format: `user_test_YYYYMMDD_HHMMSS.csv`

Example filename: `user_test_20260127_143025.csv`

## Tips for Testing

1. Use realistic interests related to Canadian bills
2. Try different demographic combinations
3. Each test should take 2-3 minutes to complete
4. All 10 bills must be rated before submission
5. Progress bar shows completion status
