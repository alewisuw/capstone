from typing import List, Dict, Optional


AGE_CONTEXT = {
    "Under 18": ["youth", "teenager", "adolescent", "student", "education", "child welfare"],
    "18-24": ["young adult", "college student", "early career", "student debt", "youth employment"],
    "25-34": ["young professional", "millennial", "early career", "housing affordability", "student debt"],
    "35-44": ["middle age", "family", "parenting", "career advancement", "work-life balance"],
    "45-54": ["middle age", "family", "career", "healthcare", "retirement planning"],
    "55-64": ["pre-retirement", "career transition", "healthcare", "pension", "retirement planning"],
    "65 or older": ["senior", "elderly", "retirement", "healthcare", "social security", "pension"],
}

GENDER_IDENTITY_CONTEXT = {
    "Woman": ["women", "feminism", "gender equality", "reproductive rights", "maternal health"],
    "Man": ["men", "masculinity", "gender issues", "men's health"],
    "Non-binary": ["non-binary", "gender identity", "lgbtq+ rights", "gender diversity"],
    "Two-Spirit": ["two-spirit", "indigenous lgbtq+", "gender identity", "indigenous rights"],
    "Transgender": ["transgender", "gender identity", "lgbtq+ rights", "gender-affirming care"],
    "Prefer to self-describe": ["gender identity", "lgbtq+ rights"],
}

INDIGENOUS_STATUS_CONTEXT = {
    "First Nations (Status)": ["indigenous", "first nations", "treaty rights", "status indian"],
    "First Nations (Non-Status)": ["indigenous", "first nations", "non-status", "indigenous rights"],
    "Metis": ["metis", "indigenous", "metis rights", "indigenous culture"],
    "Inuit": ["inuit", "indigenous", "northern", "inuit rights", "arctic"],
}

CITIZENSHIP_STATUS_CONTEXT = {
    "Canadian Citizen (Canadian born)": ["citizenship", "canadian citizen", "civic participation", "voting rights"],
    "Canadian Citizen (Foreign born)": ["citizenship", "citizenship act", "naturalized citizen", "naturalization", "immigration", "integration", "multiculturalism"],
    "Permanent Resident": ["permanent resident", "immigration", "settlement", "pathway to citizenship", "citizenship", "naturalization"],
    "Temporary Foreign Worker": ["temporary foreign worker", "labour rights", "immigration", "work permits"],
    "International Student": ["international student", "tuition", "immigration", "student visa", "education"],
    "Refugee or Protected Person": ["refugee", "asylum", "refugee rights", "immigration", "humanitarian"],
    "Other Immigration Status": ["immigration", "immigration status", "newcomer"],
}

FAMILY_STATUS_CONTEXT = {
    "No dependents": ["single", "individual tax", "independent living"],
    "Parent/guardian to child(ren) under 18": ["parent", "childcare", "child benefit", "family", "education", "parental leave"],
    "Caregiver to adult family member": ["caregiver", "elder care", "home care", "caregiver support"],
    "Both child and adult caregiver (sandwich generation)": ["sandwich generation", "caregiver", "childcare", "elder care", "family support"],
}

INCOME_RANGE_CONTEXT = {
    "Under $20,000": ["poverty", "low income", "social assistance", "minimum wage", "basic income"],
    "$20,000-$39,999": ["low income", "working poor", "social services", "affordable housing"],
    "$40,000-$59,999": ["middle income", "working class", "tax relief", "economic security"],
    "$60,000-$79,999": ["middle income", "middle class", "tax policy", "economic security"],
    "$80,000-$99,999": ["upper middle income", "middle class", "tax policy", "economic security"],
    "$100,000-$149,999": ["high income", "upper middle class", "tax policy", "wealth"],
    "$150,000-$200,000": ["high income", "wealth", "tax policy", "investment"],
    "$200,000-$250,000": ["wealth", "high income", "tax policy", "investment", "business"],
}

EMPLOYMENT_STATUS_CONTEXT = {
    "Employed": ["employment", "labour rights", "workplace safety", "taxation"],
    "Unemployed": ["unemployment", "employment insurance", "job training", "social assistance", "labour market"],
}

DISABILITY_STATUS_CONTEXT = {
    "No disability": [],
    "Physical disability": ["physical disability", "accessibility", "disability rights", "mobility"],
    "Sensory disability (e.g. visual or hearing impairment)": ["sensory disability", "visual impairment", "hearing impairment", "accessibility"],
    "Cognitive or learning disability": ["cognitive disability", "learning disability", "disability rights", "education"],
    "Mental health-related disability": ["mental health", "mental illness", "disability rights", "healthcare"],
    "Chronic illness or health condition": ["chronic illness", "disability rights", "healthcare", "medical"],
}

HOUSING_STATUS_CONTEXT = {
    "Homeowner": ["homeowner", "property tax", "mortgage", "housing market"],
    "Renter": ["renter", "tenant rights", "rent control", "affordable housing"],
    "Living with family/friends (not paying rent)": ["housing affordability", "cost of living", "youth housing"],
    "Transitional / Homeless": ["homelessness", "housing crisis", "shelter", "social housing", "supportive housing"],
}

FIELD_CONTEXT_MAP = {
    "age": AGE_CONTEXT,
    "gender_identity": GENDER_IDENTITY_CONTEXT,
    "indigenous_status": INDIGENOUS_STATUS_CONTEXT,
    "citizenship_status": CITIZENSHIP_STATUS_CONTEXT,
    "family_status": FAMILY_STATUS_CONTEXT,
    "income_range_(annual,_before_tax)": INCOME_RANGE_CONTEXT,
    "employment_status": EMPLOYMENT_STATUS_CONTEXT,
    "disability_status": DISABILITY_STATUS_CONTEXT,
    "housing_status": HOUSING_STATUS_CONTEXT,
}


class DemographicContextGenerator:
    @classmethod
    def generate_demographic_context(cls, demographics: Dict) -> List[str]:
        context: List[str] = []
        for key, mapping in FIELD_CONTEXT_MAP.items():
            value = demographics.get(key)
            if not value:
                continue
            terms = mapping.get(value, [])
            context.extend(terms)
        return context
