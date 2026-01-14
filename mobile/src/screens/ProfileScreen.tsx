import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { RootTabParamList } from '../types';
import { getProfile, getProfiles } from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import type { UserProfile } from '../types';
import { theme } from '../theme';
import { categoryColors, normalizeTag, tagCategoryLookup } from '../data/tagCategories';
import { useAuth } from '../context/AuthContext';

type ProfileScreenProps = BottomTabScreenProps<RootTabParamList, 'Profile'>;

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const [username, setUsername] = useState<string>('su_victor21');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [availableProfiles, setAvailableProfiles] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showUsernameInput, setShowUsernameInput] = useState<boolean>(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    const effective = user?.username || username;
    if (effective) {
      setUsername(effective);
      loadProfile(effective);
    }
  }, [user]);

  const loadProfiles = async (): Promise<void> => {
    try {
      const data = await getProfiles();
      setAvailableProfiles(data);
    } catch (err) {
      console.error('Failed to load profiles:', err);
    }
  };

  const loadProfile = async (user: string): Promise<void> => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getProfile(user.toLowerCase());
      setProfile(data);
      setShowUsernameInput(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameChange = (text: string): void => {
    setUsername(text);
  };

  const handleLoadProfile = (): void => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }
    loadProfile(username.trim());
  };

  const handleViewRecommendations = (): void => {
    if (profile) {
      navigation.navigate('Recommendations', { username: profile.name });
    }
  };

  const formatLabel = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  };

  const formatValue = (value: string | undefined): string => {
    if (!value) return '';
    if (typeof value === 'string') {
      return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }
    return String(value);
  };

  const getInterestChipStyle = (interest: string) => {
    const normalized = normalizeTag(interest);
    const category = tagCategoryLookup[normalized];
    const backgroundColor = category ? categoryColors[category] : theme.colors.surfaceMuted;
    const textColor = category ? '#ffffff' : theme.colors.textDark;
    return { backgroundColor, textColor };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={theme.gradients.header}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Profile</Text>
        
        {!showUsernameInput && !user ? (
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setShowUsernameInput(true)}
          >
            <Ionicons name="person" size={20} color={theme.colors.accent} />
            <Text style={styles.searchButtonText}>
              {username || 'Enter username'}
            </Text>
          </TouchableOpacity>
        ) : !user ? (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter username"
              placeholderTextColor="#6b6b6b"
              value={username}
              onChangeText={handleUsernameChange}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.searchIconButton}
              onPress={handleLoadProfile}
            >
              <Ionicons name="checkmark" size={24} color={theme.colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowUsernameInput(false);
                setError(null);
              }}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.lockedRow}>
            <View style={styles.lockedChip}>
              <Ionicons name="lock-closed" size={16} color={theme.colors.accent} />
              <Text style={styles.lockedText}>{user.username}</Text>
            </View>
            <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} onRetry={() => loadProfile(username)} />
      ) : profile ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.profileCard}>
            <View style={styles.profileNameContainer}>
              <Ionicons name="person-circle" size={64} color={theme.colors.accent} />
              <Text style={styles.profileName}>{profile.name}</Text>
            </View>

            {profile.interests && profile.interests.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Interests</Text>
                <View style={styles.interestsContainer}>
                  {profile.interests.map((interest, index) => {
                    if (interest === 'nan') return null;
                    const chipStyle = getInterestChipStyle(interest);
                    return (
                      <View
                        key={index}
                        style={[
                          styles.interestChip,
                          { backgroundColor: chipStyle.backgroundColor },
                        ]}
                      >
                        <Text
                          style={[
                            styles.interestText,
                            { color: chipStyle.textColor },
                          ]}
                        >
                          {formatValue(interest)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {profile.demographics && Object.keys(profile.demographics).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Demographics</Text>
                {Object.entries(profile.demographics).map(([key, value]) => (
                  value && value !== 'prefer_not_to_say' && (
                    <View key={key} style={styles.demographicRow}>
                      <Text style={styles.demographicLabel}>{formatLabel(key)}:</Text>
                      <Text style={styles.demographicValue}>{formatValue(value)}</Text>
                    </View>
                  )
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.recommendationsButton}
              onPress={handleViewRecommendations}
            >
              <LinearGradient
                colors={theme.gradients.header}
                style={styles.recommendationsButtonGradient}
              >
                <Ionicons name="document-text" size={20} color="#fff" />
                <Text style={styles.recommendationsButtonText}>
                  View Recommendations
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {availableProfiles.length > 0 && !user && (
            <View style={styles.profilesListSection}>
              <Text style={styles.profilesListTitle}>Other Profiles</Text>
              {availableProfiles
                .filter((p) => p !== profile.name)
                .slice(0, 10)
                .map((profileName) => (
                  <TouchableOpacity
                    key={profileName}
                    style={styles.profileListItem}
                    onPress={() => {
                      setUsername(profileName);
                      loadProfile(profileName);
                    }}
                  >
                    <Text style={styles.profileListItemText}>{profileName}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="person-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyStateText}>
            Enter a username to view profile
          </Text>
        </View>
      )}
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
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  searchButtonText: {
    fontSize: 16,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: 12,
    color: theme.colors.textDark,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  searchIconButton: {
    padding: 12,
  },
  cancelButton: {
    padding: 12,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lockedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  lockedText: {
    color: theme.colors.accent,
    fontWeight: '600',
  },
  signOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  signOutText: {
    color: theme.colors.textLight,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileNameContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginTop: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: 12,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 0,
  },
  interestText: {
    fontSize: 14,
    fontWeight: '500',
  },
  demographicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  demographicLabel: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: '500',
    flex: 1,
  },
  demographicValue: {
    fontSize: 14,
    color: theme.colors.textDark,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  recommendationsButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  recommendationsButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  recommendationsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  profilesListSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profilesListTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: 12,
  },
  profileListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  profileListItemText: {
    fontSize: 16,
    color: theme.colors.textDark,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default ProfileScreen;
