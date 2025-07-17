import json
import os
import sys
from typing import List, Dict

# Configuration
PROFILE_DIR = "summaries/profiles"

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
    print("You can skip any field by pressing Enter")
    
    demographics = {}
    
    # Age
    age_input = get_user_input("Age (number): ", required=False)
    if age_input:
        try:
            demographics["age"] = int(age_input)
        except ValueError:
            print("Invalid age format, skipping...")
    
    # Income level
    print("\nIncome level options:")
    print("1. low")
    print("2. middle") 
    print("3. high")
    income_choice = get_user_input("Income level (1-3): ", required=False)
    if income_choice in ["1", "2", "3"]:
        income_map = {"1": "low", "2": "middle", "3": "high"}
        demographics["income"] = income_map[income_choice]
    
    # Location
    print("\nLocation type options:")
    print("1. urban")
    print("2. suburban")
    print("3. rural")
    location_choice = get_user_input("Location type (1-3): ", required=False)
    if location_choice in ["1", "2", "3"]:
        location_map = {"1": "urban", "2": "suburban", "3": "rural"}
        demographics["location"] = location_map[location_choice]
    
    # Education
    print("\nEducation level options:")
    print("1. high_school")
    print("2. some_college")
    print("3. bachelor")
    print("4. graduate")
    education_choice = get_user_input("Education level (1-4): ", required=False)
    if education_choice in ["1", "2", "3", "4"]:
        education_map = {
            "1": "high_school", 
            "2": "some_college", 
            "3": "bachelor", 
            "4": "graduate"
        }
        demographics["education"] = education_map[education_choice]
    
    # Occupation
    print("\nOccupation category options:")
    print("1. tech")
    print("2. healthcare")
    print("3. education")
    print("4. finance")
    print("5. government")
    print("6. retail")
    print("7. manufacturing")
    print("8. other")
    occupation_choice = get_user_input("Occupation category (1-8): ", required=False)
    if occupation_choice in ["1", "2", "3", "4", "5", "6", "7", "8"]:
        occupation_map = {
            "1": "tech", "2": "healthcare", "3": "education", 
            "4": "finance", "5": "government", "6": "retail",
            "7": "manufacturing", "8": "other"
        }
        demographics["occupation"] = occupation_map[occupation_choice]
    
    return demographics

def create_profile() -> None:
    print("Welcome to BillBoard Profile Creator!")
    print("This will help create a personalized profile for bill recommendations.\n")
    
    # Get user name
    name = get_user_input("What's your name? ")
    
    # Get interests
    interests = get_interests()
    
    # Create profile data (no demographics for now)
    profile = {
        "name": name,
        "interests": interests,
        "demographics": {}
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
    
    # Automatically run recommendations
    print(f"\nRunning recommendations now...")
    
    import subprocess
    try:
        result = subprocess.run([
            sys.executable, 
            "summaries/profile_recommendations.py", 
            name.lower()
        ], capture_output=True, text=True)
        
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