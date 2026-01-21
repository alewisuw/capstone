import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '../../components/Icon';
import type { StackScreenProps } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../types';
import { theme } from '../../theme';
import AppLogo from '../../components/AppLogo';

type BasicInfoProps = StackScreenProps<AuthStackParamList, 'BasicInfo'>;

const BasicInfoScreen: React.FC<BasicInfoProps> = ({ navigation }) => {
  const [age, setAge] = useState('');
  const [genderIdentity, setGenderIdentity] = useState('');
  const [sexAssignedAtBirth, setSexAssignedAtBirth] = useState('');
  const [ethnicity, setEthnicity] = useState('');
  const [indigenousStatus, setIndigenousStatus] = useState('');
  const [sexualOrientation, setSexualOrientation] = useState('');
  const [citizenshipStatus, setCitizenshipStatus] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [timeInCanada, setTimeInCanada] = useState('');
  const [religiousAffiliation, setReligiousAffiliation] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [familyStatus, setFamilyStatus] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [incomeRange, setIncomeRange] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [occupationType, setOccupationType] = useState('');
  const [industry, setIndustry] = useState('');
  const [disabilityStatus, setDisabilityStatus] = useState('');
  const [housingStatus, setHousingStatus] = useState('');
  const [languageAtHome, setLanguageAtHome] = useState('');
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fields = [
    {
      key: 'age',
      label: 'Age',
      value: age,
      setter: setAge,
      options: ['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65 or older'],
    },
    {
      key: 'gender_identity',
      label: 'Gender Identity',
      value: genderIdentity,
      setter: setGenderIdentity,
      options: ['Woman', 'Man', 'Non-binary', 'Two-Spirit', 'Prefer to self-describe'],
    },
    {
      key: 'sex_assigned_at_birth',
      label: 'Sex Assigned at Birth',
      value: sexAssignedAtBirth,
      setter: setSexAssignedAtBirth,
      options: ['Female', 'Male', 'Intersex'],
    },
    {
      key: 'ethnicity_racial_identity',
      label: 'Ethnicity / Racial Identity',
      value: ethnicity,
      setter: setEthnicity,
      options: [
        'Indigenous (First Nations - Status)',
        'Indigenous (First Nations - Non-Status)',
        'Metis',
        'Inuit',
        'Black',
        'East Asian',
        'South Asian',
        'Southeast Asian',
        'Middle Eastern or North African',
        'Latino or Hispanic',
        'White / Caucasian',
        'Mixed ethnicity',
        'Other (please specify)',
      ],
    },
    {
      key: 'indigenous_status',
      label: 'Indigenous Status',
      value: indigenousStatus,
      setter: setIndigenousStatus,
      options: ['First Nations (Status)', 'First Nations (Non-Status)', 'Metis', 'Inuit'],
    },
    {
      key: 'sexual_orientation',
      label: 'Sexual Orientation',
      value: sexualOrientation,
      setter: setSexualOrientation,
      options: [
        'Heterosexual (Straight)',
        'Gay',
        'Lesbian',
        'Bisexual',
        'Pansexual',
        'Asexual',
        'Queer',
        'Prefer to self-describe',
      ],
    },
    {
      key: 'citizenship_status',
      label: 'Citizenship Status',
      value: citizenshipStatus,
      setter: setCitizenshipStatus,
      options: [
        'Canadian Citizen',
        'Permanent Resident',
        'Temporary Foreign Worker',
        'International Student',
        'Refugee or Protected Person',
        'Other Immigration Status',
      ],
    },
    {
      key: 'place_of_birth',
      label: 'Place of Birth',
      value: placeOfBirth,
      setter: setPlaceOfBirth,
      options: ['Born in Canada', 'Born outside Canada'],
    },
    {
      key: 'time_in_canada',
      label: 'Length of Time in Canada',
      value: timeInCanada,
      setter: setTimeInCanada,
      options: ['Less than 1 year', '1-5 years', '6-10 years', '11 or more years', 'Not applicable'],
    },
    {
      key: 'religious_affiliation',
      label: 'Religious Affiliation',
      value: religiousAffiliation,
      setter: setReligiousAffiliation,
      options: [
        'No religion / Atheist',
        'Agnostic',
        'Christian (Catholic)',
        'Christian (Protestant)',
        'Muslim',
        'Jewish',
        'Hindu',
        'Sikh',
        'Buddhist',
        'Indigenous Spirituality',
        'Other (please specify)',
      ],
    },
    {
      key: 'marital_status',
      label: 'Marital Status',
      value: maritalStatus,
      setter: setMaritalStatus,
      options: ['Single', 'Married', 'Common-law', 'Divorced', 'Separated', 'Widowed'],
    },
    {
      key: 'family_status',
      label: 'Family Status',
      value: familyStatus,
      setter: setFamilyStatus,
      options: [
        'No dependents',
        'Parent/guardian to child(ren) under 18',
        'Caregiver to adult family member',
        'Both child and adult caregiver (sandwich generation)',
      ],
    },
    {
      key: 'education_level',
      label: 'Education Level',
      value: educationLevel,
      setter: setEducationLevel,
      options: [
        'Less than high school diploma',
        'High school diploma or equivalent',
        'Some college or university, no degree',
        'College diploma or certificate',
        "Bachelor's degree",
        "Graduate or professional degree (Master's, PhD, etc.)",
      ],
    },
    {
      key: 'income_range_(annual,_before_tax)',
      label: 'Income Range (Annual, Before Tax)',
      value: incomeRange,
      setter: setIncomeRange,
      options: [
        'Under $20,000',
        '$20,000-$39,999',
        '$40,000-$59,999',
        '$60,000-$79,999',
        '$80,000-$99,999',
        '$100,000-$149,999',
        '$150,000-$200,000',
        '$200,000-$250,000',
      ],
    },
    {
      key: 'employment_status',
      label: 'Employment Status',
      value: employmentStatus,
      setter: setEmploymentStatus,
      options: [
        'Employed full-time',
        'Employed part-time',
        'Self-employed',
        'Unemployed, looking for work',
        'Not in labour force (e.g. student, retired, caregiver)',
      ],
    },
    {
      key: 'occupation_type',
      label: 'Occupation Type',
      value: occupationType,
      setter: setOccupationType,
      options: [
        'Management',
        'Business, finance & administration',
        'Natural and applied sciences',
        'Health occupations',
        'Education, law, and social services',
        'Art, culture, recreation, sport',
        'Sales and service',
        'Trades, transport, and equipment operation',
        'Natural resources and agriculture',
        'Manufacturing and utilities',
        'Student',
        'Unemployed',
        'Other',
      ],
    },
    {
      key: 'industry',
      label: 'Industry',
      value: industry,
      setter: setIndustry,
      options: [
        'Health care and social assistance',
        'Educational services',
        'Professional, scientific and technical services',
        'Finance and insurance',
        'Manufacturing',
        'Construction',
        'Retail trade',
        'Public administration',
        'Accommodation and food services',
        'Transportation and warehousing',
        'Information and cultural industries',
        'Agriculture, forestry, fishing and hunting',
        'Mining, quarrying, and oil & gas',
        'Arts, entertainment and recreation',
        'Other services (repair, personal services, etc.)',
        'Student / Not in labour force',
      ],
    },
    {
      key: 'disability_status',
      label: 'Disability Status / Functional Ability',
      value: disabilityStatus,
      setter: setDisabilityStatus,
      options: [
        'No disability',
        'Physical disability',
        'Sensory disability (e.g. visual or hearing impairment)',
        'Cognitive or learning disability',
        'Mental health-related disability',
        'Chronic illness or health condition',
      ],
    },
    {
      key: 'housing_status',
      label: 'Housing Status',
      value: housingStatus,
      setter: setHousingStatus,
      options: [
        'Homeowner',
        'Renter',
        'Living with family/friends (not paying rent)',
        'Transitional / Homeless',
      ],
    },
    {
      key: 'language_at_home',
      label: 'Language(s) Spoken at Home / Mother Tongue',
      value: languageAtHome,
      setter: setLanguageAtHome,
      options: [
        'English',
        'French',
        'Both English and French',
        'Indigenous language(s)',
        'Other (please specify)',
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradients.auth} style={styles.header}>
        <AppLogo width={90} height={90} />
      </LinearGradient>

      <Pressable style={styles.card} onPress={() => setOpenKey(null)}>
        <ScrollView contentContainerStyle={styles.cardContent}>
          <Text style={styles.title}>Basic Information</Text>
          <Text style={styles.subtitle}>
            All fields are optional and will improve recommendations.
          </Text>

          {fields.map((field) => {
            const isOpen = openKey === field.key;
            return (
              <View key={field.key} style={styles.field}>
                <Text style={styles.label}>{field.label}</Text>
                <TouchableOpacity
                  style={styles.inputRow}
                  onPress={() => setOpenKey(isOpen ? null : field.key)}
                >
                  <Text style={styles.inputText}>
                    {field.value || 'Select an option'}
                  </Text>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#9b9b9b"
                  />
                </TouchableOpacity>
                {isOpen ? (
                  <View style={styles.dropdown}>
                    {field.options.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={styles.optionRow}
                        onPress={() => {
                          field.setter(option);
                          setOpenKey(null);
                        }}
                      >
                        <Text style={styles.optionText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={async () => {
              setError(null);
              const demographics = {
                age,
                gender_identity: genderIdentity,
                sex_assigned_at_birth: sexAssignedAtBirth,
                ethnicity_racial_identity: ethnicity,
                indigenous_status: indigenousStatus,
                sexual_orientation: sexualOrientation,
                citizenship_status: citizenshipStatus,
                place_of_birth: placeOfBirth,
                time_in_canada: timeInCanada,
                religious_affiliation: religiousAffiliation,
                marital_status: maritalStatus,
                family_status: familyStatus,
                education_level: educationLevel,
                "income_range_(annual,_before_tax)": incomeRange,
                employment_status: employmentStatus,
                occupation_type: occupationType,
                industry,
                disability_status: disabilityStatus,
                housing_status: housingStatus,
                language_at_home: languageAtHome,
              };
              navigation.navigate('Interests', { demographics });
            }}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 56,
    paddingBottom: 24,
    alignItems: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -12,
  },
  cardContent: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textDark,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 16,
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surface,
    paddingVertical: 10,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.textDark,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginTop: 8,
    overflow: 'hidden',
  },
  optionRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  optionText: {
    fontSize: 14,
    color: theme.colors.textDark,
  },
  primaryButton: {
    marginTop: 24,
    backgroundColor: theme.colors.black,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    marginTop: 12,
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default BasicInfoScreen;
