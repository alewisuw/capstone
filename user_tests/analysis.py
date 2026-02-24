import os
from glob import glob
import csv
from collections import defaultdict

# Load all user test CSV files
results_dir = "/mnt/c/codetings/capstone/user_tests/results"
user_test_files = glob(os.path.join(results_dir, "user_test_*.csv"))

# Combine all user test data
all_data = []
for file in user_test_files:
    with open(file, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            all_data.append(row)

# Load all general feedback files
general_feedback = []
general_feedback_files = glob(os.path.join(results_dir, "general_feedback*.csv"))
for file in general_feedback_files:
    with open(file, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            general_feedback.append(row)

print("=" * 80)
print("USER TEST ANALYSIS: FUSED EMBEDDING vs TAG QUERY")
print("=" * 80)

# ============================================================================
# 1. METHOD COMPARISON - RELEVANCE
# ============================================================================
print("\n" + "=" * 80)
print("1. RELEVANCE COMPARISON")
print("=" * 80)

# Calculate relevance by method
method_stats = defaultdict(lambda: {'relevance_sum': 0, 'relevance_count': 0, 
                                     'summary_sum': 0, 'summary_count': 0})

for row in all_data:
    method = row['method']
    relevance = int(row['relevance'])
    summary = int(row['summary_effective'])
    
    method_stats[method]['relevance_sum'] += relevance
    method_stats[method]['relevance_count'] += 1
    method_stats[method]['summary_sum'] += summary
    method_stats[method]['summary_count'] += 1

print("\nRelevance Statistics by Method:")
for method, stats in sorted(method_stats.items()):
    avg_relevance = (stats['relevance_sum'] / stats['relevance_count']) * 100
    print(f"  {method:20s}: {stats['relevance_sum']:2d}/{stats['relevance_count']:2d} = {avg_relevance:.2f}%")

fused_relevance = (method_stats['fused_embedding']['relevance_sum'] / 
                   method_stats['fused_embedding']['relevance_count']) * 100
tag_relevance = (method_stats['tag_query']['relevance_sum'] / 
                method_stats['tag_query']['relevance_count']) * 100

print(f"\n📊 Fused Embedding Relevance: {fused_relevance:.2f}%")
print(f"📊 Tag Query Relevance: {tag_relevance:.2f}%")

if fused_relevance > tag_relevance:
    print(f"✅ Fused Embedding performed {fused_relevance - tag_relevance:.2f}% better on relevance")
elif tag_relevance > fused_relevance:
    print(f"✅ Tag Query performed {tag_relevance - fused_relevance:.2f}% better on relevance")
else:
    print("⚖️  Both methods performed equally on relevance")

# ============================================================================
# 2. SUMMARY EFFECTIVENESS
# ============================================================================
print("\n" + "=" * 80)
print("2. SUMMARY EFFECTIVENESS")
print("=" * 80)

print("\nSummary Effectiveness by Method:")
for method, stats in sorted(method_stats.items()):
    avg_summary = (stats['summary_sum'] / stats['summary_count']) * 100
    print(f"  {method:20s}: {stats['summary_sum']:2d}/{stats['summary_count']:2d} = {avg_summary:.2f}%")

fused_summary = (method_stats['fused_embedding']['summary_sum'] / 
                 method_stats['fused_embedding']['summary_count']) * 100
tag_summary = (method_stats['tag_query']['summary_sum'] / 
               method_stats['tag_query']['summary_count']) * 100

print(f"\n📝 Fused Embedding Summary Effectiveness: {fused_summary:.2f}%")
print(f"📝 Tag Query Summary Effectiveness: {tag_summary:.2f}%")

# Overall summary effectiveness
total_summary = sum(int(row['summary_effective']) for row in all_data)
total_count = len(all_data)
overall_summary_effectiveness = (total_summary / total_count) * 100
print(f"\n📊 Overall Summary Effectiveness: {overall_summary_effectiveness:.2f}%")

if overall_summary_effectiveness >= 85:
    print("✅ Summaries are HIGHLY effective - users find them very helpful")
elif overall_summary_effectiveness >= 70:
    print("✅ Summaries are EFFECTIVE - users generally find them helpful")
elif overall_summary_effectiveness >= 50:
    print("⚠️  Summaries are MODERATELY effective - room for improvement")
else:
    print("❌ Summaries need SIGNIFICANT improvement")

# ============================================================================
# 3. USER PREFERENCE (from general feedback)
# ============================================================================
print("\n" + "=" * 80)
print("3. USER PREFERENCE")
print("=" * 80)

# Clean and count preferences
preference_counts = {
    'method1 (fused_embedding)': 0,
    'method2 (tag_query)': 0,
    'no_preference': 0,
}

for row in general_feedback:
    # Check method_preference column first (if it exists)
    method_pref = row.get('method_preference', '').strip().lower()
    feedback = row.get('general_feedback', '').strip().lower()
    
    # Combine both fields for checking
    combined = method_pref + ' ' + feedback
    
    if 'method1' in combined or 'method 1' in combined:
        preference_counts['method1 (fused_embedding)'] += 1
    elif 'method2' in combined or 'method 2' in combined:
        preference_counts['method2 (tag_query)'] += 1
    elif 'no_preference' in combined or 'no preference' in combined:
        preference_counts['no_preference'] += 1

print("\nUser Preference Counts:")
for pref, count in preference_counts.items():
    print(f"  {pref}: {count}")

total_valid_prefs = sum(preference_counts.values())
total_feedback = len(general_feedback)
print(f"\nTotal feedback responses: {total_feedback}")
print(f"Valid method preferences: {total_valid_prefs}")
if total_valid_prefs > 0:
    print("\nUser Preference Percentages:")
    for pref, count in preference_counts.items():
        pct = (count / total_valid_prefs * 100) if total_valid_prefs > 0 else 0
        print(f"  {pref}: {pct:.1f}%")

# ============================================================================
# 4. DETAILED BREAKDOWN BY USER SESSION
# ============================================================================
print("\n" + "=" * 80)
print("4. BREAKDOWN BY USER SESSION")
print("=" * 80)

for i, file in enumerate(sorted(user_test_files), 1):
    session_data = []
    with open(file, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            session_data.append(row)
    
    if session_data:
        print(f"\nSession {i}: {os.path.basename(file)}")
        interests = session_data[0]['interests']
        print(f"  Interests: {interests[:80]}...")
        
        for method in ['fused_embedding', 'tag_query']:
            method_data = [row for row in session_data if row['method'] == method]
            if method_data:
                rel_sum = sum(int(row['relevance']) for row in method_data)
                summ_sum = sum(int(row['summary_effective']) for row in method_data)
                count = len(method_data)
                rel = (rel_sum / count) * 100
                summ = (summ_sum / count) * 100
                print(f"  {method:20s} - Relevance: {rel:5.1f}% | Summary: {summ:5.1f}%")

# ============================================================================
# 5. COMBINED SCORE
# ============================================================================
print("\n" + "=" * 80)
print("5. COMBINED PERFORMANCE SCORE")
print("=" * 80)

# Weight relevance more heavily as it's more important
relevance_weight = 0.7
summary_weight = 0.3

fused_combined = (fused_relevance * relevance_weight) + (fused_summary * summary_weight)
tag_combined = (tag_relevance * relevance_weight) + (tag_summary * summary_weight)

print(f"\nCombined Score (70% relevance + 30% summary):")
print(f"  Fused Embedding: {fused_combined:.2f}")
print(f"  Tag Query:       {tag_combined:.2f}")

# ============================================================================
# 6. FINAL RECOMMENDATION
# ============================================================================
print("\n" + "=" * 80)
print("6. FINAL RECOMMENDATION")
print("=" * 80)

print("\n🔍 Analysis Summary:")
print(f"  - Fused Embedding Relevance: {fused_relevance:.1f}%")
print(f"  - Tag Query Relevance: {tag_relevance:.1f}%")
print(f"  - Overall Summary Effectiveness: {overall_summary_effectiveness:.1f}%")
print(f"  - User Preference: Method 1 ({preference_counts['method1 (fused_embedding)']} votes) vs Method 2 ({preference_counts['method2 (tag_query)']} votes)")

print("\n🎯 Recommendation:")
if fused_combined > tag_combined:
    diff = fused_combined - tag_combined
    print(f"✅ FUSED EMBEDDING is the better method (superior by {diff:.1f} points)")
    print("   It provides more relevant bill recommendations to users.")
else:
    diff = tag_combined - fused_combined
    print(f"✅ TAG QUERY is the better method (superior by {diff:.1f} points)")
    print("   It provides more relevant bill recommendations to users.")

print("\n📝 Summary Quality:")
if overall_summary_effectiveness >= 85:
    print("✅ Summaries are working VERY WELL - keep the current approach")
elif overall_summary_effectiveness >= 70:
    print("✅ Summaries are EFFECTIVE but could be refined for better clarity")
else:
    print("⚠️  Summaries need improvement - consider revising the generation approach")

print("\n" + "=" * 80)
