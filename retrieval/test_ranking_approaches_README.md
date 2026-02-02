# Ranking Approaches Test

## What This Does

This script compares two different methods for recommending bills to users based on their interests and demographics.

## Two Approaches

### Approach 1: Fused Embedding (Current)
- Combines user interests and demographics into a single embedding vector
- Searches the bill database once using this combined vector
- Simpler, but mixes different types of information together

### Approach 2: Separate Rankings + RRF (New)
- Searches separately: one search for interests, another for demographics
- Combines the two result lists using Reciprocal Rank Fusion (RRF)
- Gives more weight to interests (80%) than demographics (20%)
- More flexible, allows fine-tuning the balance between interests and demographics

## Results

The script shows:
- **Overlap**: How many bills appear in both approaches' top results
- **Unique bills**: Bills that only appear in one approach
- **Average scores**: Similarity scores for the top results

## Usage
Example:
```bash
python retrieval/test_ranking_approaches.py su_victor21 5
```