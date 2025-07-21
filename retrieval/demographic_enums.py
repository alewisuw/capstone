from enum import Enum
from typing import List, Dict, Optional

class AgeGroup(Enum):
    UNDER_18 = "under_18"
    AGE_18_24 = "18_24"
    AGE_25_34 = "25_34"
    AGE_35_44 = "35_44"
    AGE_45_54 = "45_54"
    AGE_55_64 = "55_64"
    AGE_65_PLUS = "65_plus"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"

class GenderIdentity(Enum):
    WOMAN = "woman"
    MAN = "man"
    NON_BINARY = "non_binary"
    TWO_SPIRIT = "two_spirit"
    PREFER_TO_SELF_DESCRIBE = "prefer_to_self_describe"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"

class EthnicityRacialIdentity(Enum):
    INDIGENOUS_FIRST_NATIONS_STATUS = "indigenous_first_nations_status"
    INDIGENOUS_FIRST_NATIONS_NON_STATUS = "indigenous_first_nations_non_status"
    METIS = "metis"
    INUIT = "inuit"
    BLACK = "black"
    EAST_ASIAN = "east_asian"
    SOUTH_ASIAN = "south_asian"
    SOUTHEAST_ASIAN = "southeast_asian"
    MIDDLE_EASTERN_NORTH_AFRICAN = "middle_eastern_north_african"
    LATINO_HISPANIC = "latino_hispanic"
    WHITE_CAUCASIAN = "white_caucasian"
    MIXED_ETHNICITY = "mixed_ethnicity"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"

class IndigenousStatus(Enum):
    FIRST_NATIONS_STATUS = "first_nations_status"
    FIRST_NATIONS_NON_STATUS = "first_nations_non_status"
    METIS = "metis"
    INUIT = "inuit"
    NOT_INDIGENOUS = "not_indigenous"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"

class SexualOrientation(Enum):
    HETEROSEXUAL_STRAIGHT = "heterosexual_straight"
    GAY = "gay"
    LESBIAN = "lesbian"
    BISEXUAL = "bisexual"
    PANSEXUAL = "pansexual"
    ASEXUAL = "asexual"
    QUEER = "queer"
    PREFER_TO_SELF_DESCRIBE = "prefer_to_self_describe"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"

class IncomeRange(Enum):
    UNDER_20000 = "under_20000"
    AGE_20000_39999 = "20000_39999"
    AGE_40000_59999 = "40000_59999"
    AGE_60000_79999 = "60000_79999"
    AGE_80000_99999 = "80000_99999"
    AGE_100000_149999 = "100000_149999"
    AGE_150000_200000 = "150000_200000"
    AGE_200000_250000 = "200000_250000"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"

class DisabilityStatus(Enum):
    NO_DISABILITY = "no_disability"
    PHYSICAL_DISABILITY = "physical_disability"
    SENSORY_DISABILITY = "sensory_disability"
    COGNITIVE_LEARNING_DISABILITY = "cognitive_learning_disability"
    MENTAL_HEALTH_DISABILITY = "mental_health_disability"
    CHRONIC_ILLNESS = "chronic_illness"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"

class DemographicContextGenerator:
    CONTEXT_MAPPINGS = {
        AgeGroup: {
            AgeGroup.UNDER_18: ["youth", "teenager", "adolescent", "student", "education", "child welfare"],
            AgeGroup.AGE_18_24: ["young adult", "college student", "early career", "student debt", "youth employment"],
            AgeGroup.AGE_25_34: ["young professional", "millennial", "early career", "housing affordability", "student debt"],
            AgeGroup.AGE_35_44: ["middle age", "family", "parenting", "career advancement", "work-life balance"],
            AgeGroup.AGE_45_54: ["middle age", "family", "career", "healthcare", "retirement planning"],
            AgeGroup.AGE_55_64: ["pre-retirement", "career transition", "healthcare", "pension", "retirement planning"],
            AgeGroup.AGE_65_PLUS: ["senior", "elderly", "retirement", "healthcare", "social security", "pension"],
            AgeGroup.PREFER_NOT_TO_SAY: [],
        },
        GenderIdentity: {
            GenderIdentity.WOMAN: ["women", "feminism", "gender equality", "reproductive rights", "maternal health"],
            GenderIdentity.MAN: ["men", "masculinity", "gender issues", "men's health"],
            GenderIdentity.NON_BINARY: ["non-binary", "gender identity", "lgbtq+ rights", "gender diversity"],
            GenderIdentity.TWO_SPIRIT: ["two-spirit", "indigenous lgbtq+", "gender identity", "indigenous rights"],
            GenderIdentity.PREFER_TO_SELF_DESCRIBE: ["gender identity", "lgbtq+ rights"],
            GenderIdentity.PREFER_NOT_TO_SAY: [],
        },
        EthnicityRacialIdentity: {
            EthnicityRacialIdentity.INDIGENOUS_FIRST_NATIONS_STATUS: ["indigenous", "first nations", "treaty rights", "status indian"],
            EthnicityRacialIdentity.INDIGENOUS_FIRST_NATIONS_NON_STATUS: ["indigenous", "first nations", "non-status", "indigenous rights"],
            EthnicityRacialIdentity.METIS: ["metis", "indigenous", "metis rights", "indigenous culture"],
            EthnicityRacialIdentity.INUIT: ["inuit", "indigenous", "northern", "inuit rights", "arctic"],
            EthnicityRacialIdentity.BLACK: ["black", "african canadian", "racial justice", "civil rights", "anti-black racism"],
            EthnicityRacialIdentity.EAST_ASIAN: ["east asian", "chinese", "japanese", "korean", "racial justice", "asian rights"],
            EthnicityRacialIdentity.SOUTH_ASIAN: ["south asian", "indian", "pakistani", "bangladeshi", "racial justice"],
            EthnicityRacialIdentity.SOUTHEAST_ASIAN: ["southeast asian", "vietnamese", "filipino", "thai", "racial justice"],
            EthnicityRacialIdentity.MIDDLE_EASTERN_NORTH_AFRICAN: ["middle eastern", "north african", "arab", "racial justice", "islamophobia"],
            EthnicityRacialIdentity.LATINO_HISPANIC: ["latino", "hispanic", "immigration", "racial justice", "latino rights"],
            EthnicityRacialIdentity.WHITE_CAUCASIAN: ["white", "caucasian", "racial justice", "diversity", "inclusion"],
            EthnicityRacialIdentity.MIXED_ETHNICITY: ["mixed race", "multiracial", "racial justice", "diversity"],
            EthnicityRacialIdentity.OTHER: ["racial justice", "diversity", "minority rights"],
            EthnicityRacialIdentity.PREFER_NOT_TO_SAY: [],
        },
        IndigenousStatus: {
            IndigenousStatus.FIRST_NATIONS_STATUS: ["indigenous", "first nations", "status indian", "treaty rights"],
            IndigenousStatus.FIRST_NATIONS_NON_STATUS: ["indigenous", "first nations", "non-status", "indigenous rights"],
            IndigenousStatus.METIS: ["metis", "indigenous", "metis rights", "indigenous culture"],
            IndigenousStatus.INUIT: ["inuit", "indigenous", "northern", "inuit rights", "arctic"],
            IndigenousStatus.NOT_INDIGENOUS: ["non-indigenous"],
            IndigenousStatus.PREFER_NOT_TO_SAY: [],
        },
        SexualOrientation: {
            SexualOrientation.HETEROSEXUAL_STRAIGHT: ["straight", "heterosexual", "lgbtq+ rights", "inclusion"],
            SexualOrientation.GAY: ["gay", "lgbtq+ rights", "same-sex marriage", "gay rights"],
            SexualOrientation.LESBIAN: ["lesbian", "lgbtq+ rights", "women's rights", "lesbian rights"],
            SexualOrientation.BISEXUAL: ["bisexual", "lgbtq+ rights", "bisexual rights"],
            SexualOrientation.PANSEXUAL: ["pansexual", "lgbtq+ rights", "gender diversity"],
            SexualOrientation.ASEXUAL: ["asexual", "lgbtq+ rights", "asexual rights"],
            SexualOrientation.QUEER: ["queer", "lgbtq+ rights", "queer rights"],
            SexualOrientation.PREFER_TO_SELF_DESCRIBE: ["lgbtq+ rights", "sexual orientation"],
            SexualOrientation.PREFER_NOT_TO_SAY: [],
        },
        IncomeRange: {
            IncomeRange.UNDER_20000: ["poverty", "low income", "social assistance", "minimum wage", "basic income"],
            IncomeRange.AGE_20000_39999: ["low income", "working poor", "social services", "affordable housing"],
            IncomeRange.AGE_40000_59999: ["middle income", "working class", "tax relief", "economic security"],
            IncomeRange.AGE_60000_79999: ["middle income", "middle class", "tax policy", "economic security"],
            IncomeRange.AGE_80000_99999: ["upper middle income", "middle class", "tax policy", "economic security"],
            IncomeRange.AGE_100000_149999: ["high income", "upper middle class", "tax policy", "wealth"],
            IncomeRange.AGE_150000_200000: ["high income", "wealth", "tax policy", "investment"],
            IncomeRange.AGE_200000_250000: ["wealth", "high income", "tax policy", "investment", "business"],
            IncomeRange.PREFER_NOT_TO_SAY: [],
        },
        DisabilityStatus: {
            DisabilityStatus.NO_DISABILITY: ["non-disabled", "accessibility", "inclusive design"],
            DisabilityStatus.PHYSICAL_DISABILITY: ["physical disability", "accessibility", "disability rights", "mobility"],
            DisabilityStatus.SENSORY_DISABILITY: ["sensory disability", "visual impairment", "hearing impairment", "accessibility"],
            DisabilityStatus.COGNITIVE_LEARNING_DISABILITY: ["cognitive disability", "learning disability", "disability rights", "education"],
            DisabilityStatus.MENTAL_HEALTH_DISABILITY: ["mental health", "mental illness", "disability rights", "healthcare"],
            DisabilityStatus.CHRONIC_ILLNESS: ["chronic illness", "disability rights", "healthcare", "medical"],
            DisabilityStatus.PREFER_NOT_TO_SAY: [],
        },
    }    
    
    @classmethod
    def get_age_context(cls, age_input: Optional[str]) -> List[str]:
        if not age_input or age_input == "prefer_not_to_say":
            return []
        
        # Map user input to enum values
        age_mapping = {
            "under_18": AgeGroup.UNDER_18,
            "18_24": AgeGroup.AGE_18_24,
            "25_34": AgeGroup.AGE_25_34,
            "35_44": AgeGroup.AGE_35_44,
            "45_54": AgeGroup.AGE_45_54,
            "55_64": AgeGroup.AGE_55_64,
            "65_plus": AgeGroup.AGE_65_PLUS,
        }
        
        try:
            group = age_mapping.get(age_input.lower().replace(" ", "_"))
            if group:
                return cls.CONTEXT_MAPPINGS[AgeGroup][group]
        except (AttributeError, KeyError):
            pass
        return []

    @classmethod
    def _get_enum_context(cls, value: Optional[str], enum_cls, context_key) -> List[str]:
        if not value or value == "prefer_not_to_say":
            return []
        try:
            # Convert user input to enum format
            enum_value = value.lower().replace(" ", "_").replace("-", "_")
            enum_val = enum_cls(enum_value)
            return cls.CONTEXT_MAPPINGS[context_key][enum_val]
        except (ValueError, KeyError):
            return []

    @classmethod
    def generate_demographic_context(cls, demographics: Dict) -> List[str]:
        keys = [
            ("gender_identity", GenderIdentity),
            ("ethnicity_racial_identity", EthnicityRacialIdentity),
            ("indigenous_status", IndigenousStatus),
            ("sexual_orientation", SexualOrientation),
            ("income_range", IncomeRange),
            ("disability_status", DisabilityStatus),
        ]
        context = cls.get_age_context(demographics.get("age"))
        for key, enum_cls in keys:
            context += cls._get_enum_context(demographics.get(key), enum_cls, enum_cls)
        return context
