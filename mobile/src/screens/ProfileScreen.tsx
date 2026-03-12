import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '../components/Icon';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../types';
import { deleteMyAccount, getMyProfile } from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import AppLogo from '../components/AppLogo';
import type { MyProfileRecord } from '../types';
import { theme } from '../theme';
import InterestChips from '../components/InterestChips';
import { useAuth } from '../context/AuthContext';
import GradientBackground from '../components/GradientBackground';

type ProfileScreenProps = StackScreenProps<RootStackParamList, 'ProfileMain'>;

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, authToken, signOut } = useAuth();
  const [profile, setProfile] = useState<MyProfileRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.username && authToken) {
      loadMyProfile();
    }
  }, [user, authToken]);

  // Refresh profile when screen comes into focus (e.g., after editing)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (user?.username && authToken) {
        loadMyProfile();
      }
    });
    return unsubscribe;
  }, [navigation, user, authToken]);

  const loadMyProfile = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      if (!authToken) {
        setError('Missing session. Please sign in again.');
        setProfile(null);
        return;
      }
      const data = await getMyProfile(authToken);
      setProfile(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecommendations = (): void => {
    if (!profile) {
      return;
    }
    // Navigate to Recommendations tab
    navigation.getParent()?.navigate('Recommendations', { username: profile.username });
  };

  const handleDeleteAccount = (): void => {
    if (!authToken) {
      Alert.alert('Missing session', 'Please sign in again to delete your account.');
      return;
    }
    Alert.alert(
      'Delete account?',
      'This is permanent. Your account and all saved data will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMyAccount(authToken);
              signOut();
            } catch (err) {
              Alert.alert('Delete failed', 'Unable to delete your account. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatLabel = (key: string): string => {
    if (key === 'electoral_district') return 'Electoral District';
    if (key === 'electoral_district_id') return 'Electoral District ID';
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

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <GradientBackground
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={[styles.topRightLogo, { top: insets.top + 10 }]}>
          <AppLogo width={44} height={44} />
        </View>
        
      </GradientBackground>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadMyProfile} />
      ) : profile ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.profileCard}>
            {user ? (
              <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            ) : null}
            <View style={styles.profileNameContainer}>
              <Ionicons name="person-circle" size={64} color={theme.colors.accent} />
              <Text style={styles.profileName}>{profile.username}</Text>
            </View>

            {profile.interests && profile.interests.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Interests</Text>
                <InterestChips interests={profile.interests} labelTransform={formatValue} />
              </View>
            )}

            {profile.demographics && Object.keys(profile.demographics).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Personalization Features</Text>
                {Object.entries(profile.demographics).map(([key, value]) => (
                  value && value !== 'prefer_not_to_say' && key !== 'electoral_district_id' && (
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
              <GradientBackground
                style={styles.recommendationsButtonGradient}
              >
                <Ionicons name="document-text" size={20} color="#fff" />
                <Text style={styles.recommendationsButtonText}>
                  View Recommendations
                </Text>
              </GradientBackground>
            </TouchableOpacity>

            {user ? (
              <>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => navigation.navigate('EditProfile')}
                >
                  <Ionicons name="create-outline" size={20} color={theme.colors.accent} />
                  <Text style={styles.editButtonText}>Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteAccountButton}
                  onPress={handleDeleteAccount}
                >
                  <Text style={styles.deleteAccountText}>Delete Account</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="person-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyStateText}>
            Sign in to view your profile
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
    padding: 16,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  topRightLogo: {
    position: 'absolute',
    right: 14,
    top: 55,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  signOutButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  signOutText: {
    color: '#ef4444',
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
    padding: theme.spacing.lg,
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
  editButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    backgroundColor: '#fff',
    gap: 8,
  },
  editButtonText: {
    color: theme.colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteAccountButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  deleteAccountText: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default ProfileScreen;
