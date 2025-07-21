import json
import os
import sys
from typing import List, Dict

# Configuration
PROFILE_DIR = "retrieval/profiles"

def get_user_input(prompt: str, required: bool = True) -> str:
    while True:
        user_input = input(prompt).strip()
        if user_input or not required:
            return user_input
        print("This field is required. Please try again.")

def get_interests() -> List[str]:
    print("\nLet's learn about your interests!")
    print("Here are some example topics you can choose from:")
    
    # Load and display example tags
    try:
        with open("summaries/tags.json", "r") as f:
            tags_data = json.load(f)
        
        print("\nExample topics by category:")
        for category, topics in tags_data.items():
            print(f"\n{category.title()}:")
            for topic in topics:
                print(f"  - {topic}")
        
    except FileNotFoundError:
        print("(Example topics not available)")
    
    print("\nEnter your interests one by one (press Enter twice when done):")
    print("You can use the examples above or enter your own topics:")
    
    interests = []
    while True:
        interest = input(f"Interest #{len(interests) + 1}: ").strip()
        if not interest:
            if len(interests) == 0:
                print("You need at least one interest. Please enter at least one:")
                continue
            break
        interests.append(interest.lower())
    
    return interests

def get_demographics() -> Dict:
    print("\nLet's get some demographic information (optional):")
    print("You can skip any field by pressing Enter or typing 'prefer not to say'")
    
    demographics = {}
    
    # Age
    print("\nAge options:")
    print("1. Under 18")
    print("2. 18–24")
    print("3. 25–34")
    print("4. 35–44")
    print("5. 45–54")
    print("6. 55–64")
    print("7. 65 or older")
    print("8. Prefer not to say")
    age_choice = get_user_input("Age (1-8): ", required=False)
    if age_choice in ["1", "2", "3", "4", "5", "6", "7", "8"]:
        age_map = {
            "1": "under_18", "2": "18_24", "3": "25_34", "4": "35_44",
            "5": "45_54", "6": "55_64", "7": "65_plus", "8": "prefer_not_to_say"
        }
        demographics["age"] = age_map[age_choice]
    
    # Gender Identity
    print("\nGender Identity options:")
    print("1. Woman")
    print("2. Man")
    print("3. Non-binary")
    print("4. Two-Spirit")
    print("5. Prefer to self-describe")
    print("6. Prefer not to say")
    gender_choice = get_user_input("Gender Identity (1-6): ", required=False)
    if gender_choice in ["1", "2", "3", "4", "5", "6"]:
        gender_map = {
            "1": "woman", "2": "man", "3": "non_binary", "4": "two_spirit",
            "5": "prefer_to_self_describe", "6": "prefer_not_to_say"
        }
        demographics["gender_identity"] = gender_map[gender_choice]
    
    # Ethnicity/Racial Identity
    print("\nEthnicity/Racial Identity options:")
    print("1. Indigenous (First Nations – Status)")
    print("2. Indigenous (First Nations – Non-Status)")
    print("3. Métis")
    print("4. Inuit")
    print("5. Black")
    print("6. East Asian")
    print("7. South Asian")
    print("8. Southeast Asian")
    print("9. Middle Eastern or North African")
    print("10. Latino or Hispanic")
    print("11. White / Caucasian")
    print("12. Mixed ethnicity")
    print("13. Other (please specify)")
    print("14. Prefer not to say")
    ethnicity_choice = get_user_input("Ethnicity/Racial Identity (1-14): ", required=False)
    if ethnicity_choice in ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"]:
        ethnicity_map = {
            "1": "indigenous_first_nations_status", "2": "indigenous_first_nations_non_status",
            "3": "metis", "4": "inuit", "5": "black", "6": "east_asian",
            "7": "south_asian", "8": "southeast_asian", "9": "middle_eastern_north_african",
            "10": "latino_hispanic", "11": "white_caucasian", "12": "mixed_ethnicity",
            "13": "other", "14": "prefer_not_to_say"
        }
        demographics["ethnicity_racial_identity"] = ethnicity_map[ethnicity_choice]
    
    # Indigenous Status
    print("\nIndigenous Status options:")
    print("1. First Nations (Status)")
    print("2. First Nations (Non-Status)")
    print("3. Métis")
    print("4. Inuit")
    print("5. Not Indigenous")
    print("6. Prefer not to say")
    indigenous_choice = get_user_input("Indigenous Status (1-6): ", required=False)
    if indigenous_choice in ["1", "2", "3", "4", "5", "6"]:
        indigenous_map = {
            "1": "first_nations_status", "2": "first_nations_non_status",
            "3": "metis", "4": "inuit", "5": "not_indigenous", "6": "prefer_not_to_say"
        }
        demographics["indigenous_status"] = indigenous_map[indigenous_choice]
    
    # Sexual Orientation
    print("\nSexual Orientation options:")
    print("1. Heterosexual (Straight)")
    print("2. Gay")
    print("3. Lesbian")
    print("4. Bisexual")
    print("5. Pansexual")
    print("6. Asexual")
    print("7. Queer")
    print("8. Prefer to self-describe")
    print("9. Prefer not to say")
    orientation_choice = get_user_input("Sexual Orientation (1-9): ", required=False)
    if orientation_choice in ["1", "2", "3", "4", "5", "6", "7", "8", "9"]:
        orientation_map = {
            "1": "heterosexual_straight", "2": "gay", "3": "lesbian", "4": "bisexual",
            "5": "pansexual", "6": "asexual", "7": "queer", "8": "prefer_to_self_describe",
            "9": "prefer_not_to_say"
        }
        demographics["sexual_orientation"] = orientation_map[orientation_choice]
    
    # Income Range
    print("\nIncome Range options (Annual, Before Tax):")
    print("1. Under $20,000")
    print("2. $20,000–$39,999")
    print("3. $40,000–$59,999")
    print("4. $60,000–$79,999")
    print("5. $80,000–$99,999")
    print("6. $100,000–$149,999")
    print("7. $150,000–$200,000")
    print("8. $200,000–$250,000")
    print("9. Prefer not to say")
    income_choice = get_user_input("Income Range (1-9): ", required=False)
    if income_choice in ["1", "2", "3", "4", "5", "6", "7", "8", "9"]:
        income_map = {
            "1": "under_20000", "2": "20000_39999", "3": "40000_59999",
            "4": "60000_79999", "5": "80000_99999", "6": "100000_149999",
            "7": "150000_200000", "8": "200000_250000", "9": "prefer_not_to_say"
        }
        demographics["income_range"] = income_map[income_choice]
    
    # Disability Status
    print("\nDisability Status options:")
    print("1. No disability")
    print("2. Physical disability")
    print("3. Sensory disability (e.g. visual or hearing impairment)")
    print("4. Cognitive or learning disability")
    print("5. Mental health-related disability")
    print("6. Chronic illness or health condition")
    print("7. Prefer not to say")
    disability_choice = get_user_input("Disability Status (1-7): ", required=False)
    if disability_choice in ["1", "2", "3", "4", "5", "6", "7"]:
        disability_map = {
            "1": "no_disability", "2": "physical_disability", "3": "sensory_disability",
            "4": "cognitive_learning_disability", "5": "mental_health_disability",
            "6": "chronic_illness", "7": "prefer_not_to_say"
        }
        demographics["disability_status"] = disability_map[disability_choice]
    
    return demographics

def create_profile() -> None:
    print("Welcome to BillBoard Profile Creator!")
    print("This will help create a personalized profile for bill recommendations.\n")
    
    # Get user name
    name = get_user_input("What's your name? ")
    
    # Get interests
    interests = get_interests()
    
    # Get demographics
    demographics = get_demographics()
    
    # Create profile data
    profile = {
        "name": name,
        "interests": interests,
        "demographics": demographics
    }
    
    # Ensure profile directory exists
    os.makedirs(PROFILE_DIR, exist_ok=True)
    
    # Save profile
    filename = f"{name.lower()}.json"
    filepath = os.path.join(PROFILE_DIR, filename)
    
    with open(filepath, 'w') as f:
        json.dump(profile, f, indent=2)
    
    print(f"\nProfile created successfully!")
    print(f"Saved to: {filepath}")
    print(f"Name: {name}")
    print(f"Interests: {', '.join(interests)}")
    if demographics:
        print(f"Demographics collected: {len(demographics)} categories")
    
    # Automatically run recommendations
    print(f"\nRunning recommendations now...")
    
    import subprocess
    try:
        result = subprocess.run([
            sys.executable, 
            "summaries/profile_recommendations_demo.py", 
            name.lower()
        ], capture_output=True, text=True, shell=False)
        
        if result.returncode == 0:
            print("\n" + result.stdout)
        else:
            print(f"Error running recommendations: {result.stderr}")
    except Exception as e:
        print(f"Could not run recommendations automatically: {e}")
        print("Please run manually: python summaries/profile_recommendations.py {name.lower()}")

if __name__ == "__main__":
    try:
        create_profile()
    except KeyboardInterrupt:
        print("\n\nProfile creation cancelled.")
        sys.exit(1)
    except Exception as e:
        print(f"\nError creating profile: {e}")
        sys.exit(1) 