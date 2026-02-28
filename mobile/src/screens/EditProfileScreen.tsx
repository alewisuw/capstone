import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '../components/Icon';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../types';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { putMyProfile, getMyProfile } from '../services/apiService';
import AppLogo from '../components/AppLogo';
import { interestGroups } from '../data/interestGroups';
import type { MyProfileRecord } from '../types';
import GradientBackground from '../components/GradientBackground';

type EditProfileProps = StackScreenProps<RootStackParamList, 'EditProfile'>;

// Color mapping for each interest group
const groupColors: Record<string, string> = {
  'Social & Civil Rights': '#b91c1c',
  'Economic Issues': '#1d4ed8',
  'Environmental Policy': '#0f766e',
  'Healthcare': '#9d174d',
  'Education': '#6d28d9',
  'Technology & Innovation': '#0f172a',
  'Foreign Policy': '#a16207',
  'Democracy & Governance': '#374151',
  'Housing & Infrastructure': '#7c2d12',
  'Indigenous Affairs': '#7f1d1d',
  'Public Safety & Emergency Response': '#0b1324',
  'Transportation & Mobility': '#047857',
};

const EditProfileScreen: React.FC<EditProfileProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { authToken, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'demographics' | 'interests'>('demographics');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Demographics state
  const [age, setAge] = useState('');
  const [genderIdentity, setGenderIdentity] = useState('');
  const [indigenousStatus, setIndigenousStatus] = useState('');
  const [citizenshipStatus, setCitizenshipStatus] = useState('');
  const [familyStatus, setFamilyStatus] = useState('');
  const [incomeRange, setIncomeRange] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [disabilityStatus, setDisabilityStatus] = useState('');
  const [housingStatus, setHousingStatus] = useState('');
  const [openKey, setOpenKey] = useState<string | null>(null);

  // Interests state
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!authToken) {
      setError('Missing session. Please sign in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const profile = await getMyProfile(authToken);
      
      // Load demographics
      const demos = profile.demographics || {};
      setAge(demos.age || '');
      setGenderIdentity(demos.gender_identity || '');
      setIndigenousStatus(demos.indigenous_status || '');
      setCitizenshipStatus(demos.citizenship_status || '');
      setFamilyStatus(demos.family_status || '');
      setIncomeRange(demos['income_range_(annual,_before_tax)'] || '');
      setEmploymentStatus(demos.employment_status || '');
      setDisabilityStatus(demos.disability_status || '');
      setHousingStatus(demos.housing_status || '');

      // Load interests
      const interests = profile.interests || [];
      const selectedMap: Record<string, boolean> = {};
      interests.forEach((interest) => {
        selectedMap[interest] = true;
      });
      setSelected(selectedMap);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const selectedTags = useMemo(
    () => Object.entries(selected).filter(([, value]) => value).map(([tag]) => tag),
    [selected]
  );

  const handleSave = async () => {
    if (!authToken || !user?.username) {
      setError('Missing session. Please sign in again.');
      return;
    }


    setSaving(true);
    setError(null);

    try {
      const demographics = {
        age,
        gender_identity: genderIdentity,
        indigenous_status: indigenousStatus,
        citizenship_status: citizenshipStatus,
        family_status: familyStatus,
        'income_range_(annual,_before_tax)': incomeRange,
        employment_status: employmentStatus,
        disability_status: disabilityStatus,
        housing_status: housingStatus,
      };

      // Filter out empty values
      const filteredDemographics = Object.fromEntries(
        Object.entries(demographics).filter(([, value]) => value && value.trim().length > 0)
      );

      await putMyProfile(
        {
          username: user.username,
          email: '', // Will be preserved from existing profile
          demographics: filteredDemographics,
          interests: selectedTags,
          onboarded: true,
        },
        authToken
      );

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const demographicsFields = [
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
      options: ['Woman', 'Man', 'Non-binary', 'Two-Spirit', 'Transgender', 'Prefer to self-describe'],
    },
    {
      key: 'indigenous_status',
      label: 'Indigenous Status',
      value: indigenousStatus,
      setter: setIndigenousStatus,
      options: ['First Nations (Status)', 'First Nations (Non-Status)', 'Metis', 'Inuit'],
    },
    {
      key: 'citizenship_status',
      label: 'Citizenship Status',
      value: citizenshipStatus,
      setter: setCitizenshipStatus,
      options: [
        'Canadian Citizen (Canadian born)',
        'Canadian Citizen (Foreign born)',
        'Permanent Resident',
        'Temporary Foreign Worker',
        'International Student',
        'Refugee or Protected Person',
        'Other Immigration Status',
      ],
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
        'Employed',
        'Unemployed',
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
  ];

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return interestGroups;
    }
    return interestGroups
      .map((group) => ({
        ...group,
        tags: group.tags.filter((tag) => tag.toLowerCase().includes(term)),
      }))
      .filter((group) => group.tags.length > 0);
  }, [search]);

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const toggleTag = (tag: string) => {
    setSelected((prev) => ({ ...prev, [tag]: !prev[tag] }));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <GradientBackground style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </GradientBackground>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <GradientBackground style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.topRightLogo}>
          <AppLogo width={44} height={44} />
        </View>
      </GradientBackground>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'demographics' && styles.tabActive]}
          onPress={() => setActiveTab('demographics')}
        >
          <Text style={[styles.tabText, activeTab === 'demographics' && styles.tabTextActive]}>
            Demographics
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'interests' && styles.tabActive]}
          onPress={() => setActiveTab('interests')}
        >
          <Text style={[styles.tabText, activeTab === 'interests' && styles.tabTextActive]}>
            Interests
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {activeTab === 'demographics' ? (
          <Pressable onPress={() => setOpenKey(null)}>
            {demographicsFields.map((field) => {
              const isOpen = openKey === field.key;
              return (
                <View key={field.key} style={styles.field}>
                  <Text style={styles.label}>{field.label}</Text>
                  <View style={styles.inputContainer}>
                    <TouchableOpacity
                      style={[styles.inputRow, field.value && styles.inputRowWithValue]}
                      onPress={() => setOpenKey(isOpen ? null : field.key)}
                    >
                      <Text style={[styles.inputText, !field.value && styles.inputTextPlaceholder]}>
                        {field.value || 'Select an option'}
                      </Text>
                      <Ionicons
                        name={isOpen ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="#9b9b9b"
                      />
                    </TouchableOpacity>
                    {field.value ? (
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => {
                          field.setter('');
                          setOpenKey(null);
                        }}
                      >
                        <Ionicons name="close-circle" size={20} color="#9b9b9b" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  {isOpen ? (
                    <View style={styles.dropdown}>
                      {field.options.map((option) => {
                        const isSelected = option === field.value;
                        return (
                          <TouchableOpacity
                            key={option}
                            style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                            onPress={() => {
                              if (isSelected) {
                                field.setter('');
                              } else {
                                field.setter(option);
                              }
                              setOpenKey(null);
                            }}
                          >
                            <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                              {option}
                            </Text>
                            {isSelected ? (
                              <Ionicons name="checkmark-circle" size={18} color={theme.colors.accent} />
                            ) : null}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </Pressable>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Select Your Interests</Text>
            <Text style={styles.subtitle}>Tap to select or unselect your areas of interest.</Text>

            <View style={styles.searchRow}>
              <Ionicons name="search" size={18} color="#b0b0b0" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search interests"
                placeholderTextColor="#9b9b9b"
                value={search}
                onChangeText={setSearch}
              />
            </View>

            <View style={styles.groupList}>
              {filteredGroups.map((group) => {
                const isExpanded = search.trim().length > 0 || expandedGroups[group.title];
                return (
                  <View key={group.title} style={styles.groupSection}>
                    <TouchableOpacity
                      style={styles.groupHeader}
                      onPress={() => toggleGroup(group.title)}
                    >
                      <Text style={styles.groupTitle}>{group.title}</Text>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={theme.colors.textMuted}
                      />
                    </TouchableOpacity>
                    {isExpanded ? (
                      <View style={styles.tagWrap}>
                        {group.tags.map((tag) => {
                          const isSelected = !!selected[tag];
                          const groupColor = groupColors[group.title] || theme.colors.accent;
                          return (
                            <TouchableOpacity
                              key={tag}
                              style={[
                                styles.tagChip,
                                { borderColor: groupColor },
                                isSelected && {
                                  borderColor: groupColor,
                                  backgroundColor: groupColor,
                                },
                              ]}
                              onPress={() => toggleTag(tag)}
                            >
                              <Text
                                style={[
                                  styles.tagText,
                                  !isSelected && { color: groupColor },
                                  isSelected && styles.tagTextSelected,
                                ]}
                              >
                                {tag}
                              </Text>
                              {isSelected ? (
                                <Ionicons name="close-circle" size={14} color="#fff" style={styles.tagCloseIcon} />
                              ) : null}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 55,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginTop: 40,
  },
  topRightLogo: {
    position: 'absolute',
    right: 16,
    top: 55,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.colors.accent,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  tabTextActive: {
    color: theme.colors.accent,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textMuted,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: 6,
  },
  subtitle: {
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surface,
    paddingVertical: 10,
  },
  inputRowWithValue: {
    borderColor: theme.colors.accent,
    backgroundColor: '#fff',
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.textDark,
  },
  inputTextPlaceholder: {
    color: '#9b9b9b',
  },
  clearButton: {
    padding: 4,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  optionRowSelected: {
    backgroundColor: theme.colors.accent + '10',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textDark,
  },
  optionTextSelected: {
    color: theme.colors.accent,
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textDark,
  },
  groupList: {
    marginTop: 8,
  },
  groupSection: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textDark,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    backgroundColor: '#fff',
    gap: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tagTextSelected: {
    color: '#fff',
  },
  tagCloseIcon: {
    marginLeft: 2,
  },
  saveButton: {
    marginTop: 24,
    backgroundColor: theme.colors.black,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    marginBottom: 16,
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default EditProfileScreen;
