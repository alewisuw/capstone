import os
import sys
import json
import pandas as pd
import subprocess
from typing import List, Dict

PROFILE_DIR = "retrieval/profiles"
EXCEL_FILE = "retrieval/profiles/_profiles.xlsx" 

INTEREST_COLUMNS = [
    'Social and Civil RIghts', 'Economic Issues', 'Environmental Policy',
    'Healthcare', 'Education', 'Technology & Innovation', 'Foreign Policy',
    'Democracy & Governance', 'Housing & Infrastructure', 'Indigenous Affairs',
    'Public Safety & Emergency Response', 'Transportation & Mobility'
]

DEMOGRAPHIC_MAPPINGS = {
    "Age": {
        "under 18": "under_18", "18–24": "18_24", "25–34": "25_34",
        "35–44": "35_44", "45–54": "45_54", "55–64": "55_64",
        "65 or older": "65_plus", "prefer not to say": "prefer_not_to_say"
    },
    "Gender Identity": {
        "woman": "woman", "man": "man", "non-binary": "non_binary",
        "two-spirit": "two_spirit", "prefer to self-describe": "prefer_to_self_describe",
        "prefer not to say": "prefer_not_to_say"
    },
    "Ethnicity / Racial Identity": {
        "indigenous (first nations – status)": "indigenous_first_nations_status",
        "indigenous (first nations – non-status)": "indigenous_first_nations_non_status",
        "métis": "metis", "inuit": "inuit", "black": "black",
        "east asian": "east_asian", "south asian": "south_asian",
        "southeast asian": "southeast_asian", "middle eastern or north african": "middle_eastern_north_african",
        "latino or hispanic": "latino_hispanic", "white / caucasian": "white_caucasian",
        "mixed ethnicity": "mixed_ethnicity", "other (please specify)": "other",
        "prefer not to say": "prefer_not_to_say"
    },
    "Indigenous Status": {
        "first nations (status)": "first_nations_status",
        "first nations (non-status)": "first_nations_non_status",
        "métis": "metis", "inuit": "inuit",
        "not indigenous": "not_indigenous", "prefer not to say": "prefer_not_to_say"
    },
    "Sexual Orientation": {
        "heterosexual (straight)": "heterosexual_straight", "gay": "gay",
        "lesbian": "lesbian", "bisexual": "bisexual", "pansexual": "pansexual",
        "asexual": "asexual", "queer": "queer", "prefer to self-describe": "prefer_to_self_describe",
        "prefer not to say": "prefer_not_to_say"
    },
    "Income Range (Annual, Before Tax)": {
        "under $20,000": "under_20000", "$20,000–$39,999": "20000_39999",
        "$40,000–$59,999": "40000_59999", "$60,000–$79,999": "60000_79999",
        "$80,000–$99,999": "80000_99999", "$100,000–$149,999": "100000_149999",
        "$150,000–$200,000": "150000_200000", "$200,000–$250,000": "200000_250000",
        "prefer not to say": "prefer_not_to_say"
    },
    "Disability Status / Functional Ability": {
        "no disability": "no_disability", "physical disability": "physical_disability",
        "sensory disability (e.g. visual or hearing impairment)": "sensory_disability",
        "cognitive or learning disability": "cognitive_learning_disability",
        "mental health-related disability": "mental_health_disability",
        "chronic illness or health condition": "chronic_illness",
        "prefer not to say": "prefer_not_to_say"
    }
}

def normalize(val):
    return str(val).strip().lower()

def extract_demographics(row):
    demographics = {}
    for column, mapping in DEMOGRAPHIC_MAPPINGS.items():
        raw_value = normalize(row.get(column, ""))
        if raw_value in mapping:
            key = column.lower().replace(" / ", "_").replace(" ", "_")
            demographics[key] = mapping[raw_value]
    return demographics

def extract_interests(row):
    interests = []
    for topic in INTEREST_COLUMNS:
        val = str(row.get(topic, "")).strip()
        if val:
            items = [v.strip().lower() for v in val.split(",") if v.strip()]
            interests.extend(items)
    return list(set(interests))

def create_profiles_from_excel(filepath):
    df = pd.read_excel(filepath)
    os.makedirs(PROFILE_DIR, exist_ok=True)

    for idx, row in df.iterrows():
        email = str(row.get("Please add the best email to send the follow-up form to.", f"user_{idx}")).strip()
        if not email:
            continue
        name = email.split("@")[0].replace(".", "_").replace(" ", "_").lower()

        interests = extract_interests(row)
        if not interests:
            continue  

        demographics = extract_demographics(row)
        profile = {
            "name": name,
            "interests": interests,
            "demographics": demographics
        }

        filepath = os.path.join(PROFILE_DIR, f"{name}.json")
        with open(filepath, "w") as f:
            json.dump(profile, f, indent=2)
        print(f"Created profile for {name}")

if __name__ == "__main__":
    try:
        create_profiles_from_excel(EXCEL_FILE)
    except Exception as e:
        print(f"Error: {e}")