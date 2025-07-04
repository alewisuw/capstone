from enum import Enum
from typing import List, Dict, Optional

class AgeGroup(Enum):
    STUDENT = "student"
    YOUNG_ADULT = "young_adult"
    MIDDLE_AGE = "middle_age"
    SENIOR = "senior"

class IncomeLevel(Enum):
    LOW = "low"
    MIDDLE = "middle"
    HIGH = "high"

class Location(Enum):
    URBAN = "urban"
    SUBURBAN = "suburban"
    RURAL = "rural"

class Education(Enum):
    HIGH_SCHOOL = "high_school"
    BACHELOR = "bachelor"
    GRADUATE = "graduate"

class Occupation(Enum):
    TECH = "tech"
    HEALTHCARE = "healthcare"
    BUSINESS = "business"
    WORKER = "worker"
    STUDENT = "student"
    RETIRED = "retired"

class DemographicContextGenerator:
    """Generates demographic context terms based on user demographics"""
    
    # Mapping of demographic values to context terms
    AGE_CONTEXT_MAPPING = {
        AgeGroup.STUDENT: ["student issues", "education", "campus life"],
        AgeGroup.YOUNG_ADULT: ["young adult", "millennial", "early career"],
        AgeGroup.MIDDLE_AGE: ["middle age", "family", "career advancement"],
        AgeGroup.SENIOR: ["senior", "retirement", "healthcare", "social security"]
    }
    
    INCOME_CONTEXT_MAPPING = {
        IncomeLevel.LOW: ["poverty", "assistance", "minimum wage", "low income"],
        IncomeLevel.MIDDLE: ["middle class", "working class", "tax relief"],
        IncomeLevel.HIGH: ["wealth", "investment", "business", "high income"]
    }
    
    LOCATION_CONTEXT_MAPPING = {
        Location.URBAN: ["urban development", "city planning", "public transportation"],
        Location.SUBURBAN: ["suburban", "town planning", "community development"],
        Location.RURAL: ["rural development", "agriculture", "small town"]
    }
    
    EDUCATION_CONTEXT_MAPPING = {
        Education.HIGH_SCHOOL: ["secondary education", "vocational training", "high school"],
        Education.BACHELOR: ["higher education", "student loans", "university", "college"],
        Education.GRADUATE: ["graduate education", "research", "academia", "advanced degree"]
    }
    
    OCCUPATION_CONTEXT_MAPPING = {
        Occupation.TECH: ["technology", "digital rights", "privacy", "innovation", "software"],
        Occupation.HEALTHCARE: ["healthcare", "medical", "public health", "hospital"],
        Occupation.BUSINESS: ["business", "entrepreneurship", "small business", "corporate"],
        Occupation.WORKER: ["worker rights", "employment", "labor", "unions"],
        Occupation.STUDENT: ["student", "education", "campus"],
        Occupation.RETIRED: ["retirement", "senior", "pension"]
    }
    
    @classmethod
    def get_age_context(cls, age: Optional[int]) -> List[str]:
        """Get context terms based on age"""
        if not age:
            return []
        
        if age < 18:
            return cls.AGE_CONTEXT_MAPPING[AgeGroup.STUDENT]
        elif age < 30:
            return cls.AGE_CONTEXT_MAPPING[AgeGroup.YOUNG_ADULT]
        elif age < 55:
            return cls.AGE_CONTEXT_MAPPING[AgeGroup.MIDDLE_AGE]
        else:
            return cls.AGE_CONTEXT_MAPPING[AgeGroup.SENIOR]
    
    @classmethod
    def get_income_context(cls, income: Optional[str]) -> List[str]:
        """Get context terms based on income level"""
        if not income:
            return []
        
        try:
            income_enum = IncomeLevel(income.lower())
            return cls.INCOME_CONTEXT_MAPPING[income_enum]
        except ValueError:
            return []
    
    @classmethod
    def get_location_context(cls, location: Optional[str]) -> List[str]:
        """Get context terms based on location"""
        if not location:
            return []
        
        try:
            location_enum = Location(location.lower())
            return cls.LOCATION_CONTEXT_MAPPING[location_enum]
        except ValueError:
            return []
    
    @classmethod
    def get_education_context(cls, education: Optional[str]) -> List[str]:
        """Get context terms based on education level"""
        if not education:
            return []
        
        try:
            education_enum = Education(education.lower())
            return cls.EDUCATION_CONTEXT_MAPPING[education_enum]
        except ValueError:
            return []
    
    @classmethod
    def get_occupation_context(cls, occupation: Optional[str]) -> List[str]:
        """Get context terms based on occupation"""
        if not occupation:
            return []
        
        try:
            occupation_enum = Occupation(occupation.lower())
            return cls.OCCUPATION_CONTEXT_MAPPING[occupation_enum]
        except ValueError:
            return []
    
    @classmethod
    def generate_demographic_context(cls, demographics: Dict) -> List[str]:
        """Generate all demographic context terms for a user profile"""
        context_terms = []
        
        # Add age-based context
        age = demographics.get('age')
        context_terms.extend(cls.get_age_context(age))
        
        # Add income-based context
        income = demographics.get('income')
        context_terms.extend(cls.get_income_context(income))
        
        # Add location-based context
        location = demographics.get('location')
        context_terms.extend(cls.get_location_context(location))
        
        # Add education-based context
        education = demographics.get('education')
        context_terms.extend(cls.get_education_context(education))
        
        # Add occupation-based context
        occupation = demographics.get('occupation')
        context_terms.extend(cls.get_occupation_context(occupation))
        
        return context_terms

def validate_demographics(demographics: Dict) -> Dict[str, List[str]]:
    """Validate and return any invalid demographic values"""
    errors = {}
    
    # Validate age
    age = demographics.get('age')
    if age is not None and (not isinstance(age, int) or age < 0 or age > 120):
        errors['age'] = [f"Invalid age: {age}. Must be between 0 and 120."]
    
    # Validate income
    income = demographics.get('income')
    if income and income not in [e.value for e in IncomeLevel]:
        errors['income'] = [f"Invalid income: {income}. Valid values: {[e.value for e in IncomeLevel]}"]
    
    # Validate location
    location = demographics.get('location')
    if location and location not in [e.value for e in Location]:
        errors['location'] = [f"Invalid location: {location}. Valid values: {[e.value for e in Location]}"]
    
    # Validate education
    education = demographics.get('education')
    if education and education not in [e.value for e in Education]:
        errors['education'] = [f"Invalid education: {education}. Valid values: {[e.value for e in Education]}"]
    
    # Validate occupation
    occupation = demographics.get('occupation')
    if occupation and occupation not in [e.value for e in Occupation]:
        errors['occupation'] = [f"Invalid occupation: {occupation}. Valid values: {[e.value for e in Occupation]}"]
    
    return errors 