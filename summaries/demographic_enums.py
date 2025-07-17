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
    CONTEXT_MAPPINGS = {
        AgeGroup: {
            AgeGroup.STUDENT: ["student issues", "education", "campus life"],
            AgeGroup.YOUNG_ADULT: ["young adult", "millennial", "early career"],
            AgeGroup.MIDDLE_AGE: ["middle age", "family", "career advancement"],
            AgeGroup.SENIOR: ["senior", "retirement", "healthcare", "social security"],
        },
        IncomeLevel: {
            IncomeLevel.LOW: ["poverty", "assistance", "minimum wage", "low income"],
            IncomeLevel.MIDDLE: ["middle class", "working class", "tax relief"],
            IncomeLevel.HIGH: ["wealth", "investment", "business", "high income"],
        },
        Location: {
            Location.URBAN: ["urban development", "city planning", "public transportation"],
            Location.SUBURBAN: ["suburban", "town planning", "community development"],
            Location.RURAL: ["rural development", "agriculture", "small town"],
        },
        Education: {
            Education.HIGH_SCHOOL: ["secondary education", "vocational training", "high school"],
            Education.BACHELOR: ["higher education", "student loans", "university", "college"],
            Education.GRADUATE: ["graduate education", "research", "academia", "advanced degree"],
        },
        Occupation: {
            Occupation.TECH: ["technology", "digital rights", "privacy", "innovation", "software"],
            Occupation.HEALTHCARE: ["healthcare", "medical", "public health", "hospital"],
            Occupation.BUSINESS: ["business", "entrepreneurship", "small business", "corporate"],
            Occupation.WORKER: ["worker rights", "employment", "labor", "unions"],
            Occupation.STUDENT: ["student", "education", "campus"],
            Occupation.RETIRED: ["retirement", "senior", "pension"],
        },
    }    
    
    @classmethod
    def get_age_context(cls, age: Optional[int]) -> List[str]:
        if age is None:
            return []
        if age < 18:
            group = AgeGroup.STUDENT
        elif age < 30:
            group = AgeGroup.YOUNG_ADULT
        elif age < 55:
            group = AgeGroup.MIDDLE_AGE
        else:
            group = AgeGroup.SENIOR
        return cls.CONTEXT_MAPPINGS[AgeGroup][group]

    @classmethod
    def _get_enum_context(cls, value: Optional[str], enum_cls, context_key) -> List[str]:
        if not value:
            return []
        try:
            enum_val = enum_cls(value.lower())
            return cls.CONTEXT_MAPPINGS[context_key][enum_val]
        except ValueError:
            return []

    @classmethod
    def generate_demographic_context(cls, demographics: Dict) -> List[str]:
        keys = [
            ("income", IncomeLevel),
            ("location", Location),
            ("education", Education),
            ("occupation", Occupation),
        ]
        context = cls.get_age_context(demographics.get("age"))
        for key, enum_cls in keys:
            context += cls._get_enum_context(demographics.get(key), enum_cls, enum_cls)
        return context
