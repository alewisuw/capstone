import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../types';
import { getRecommendations, getProfiles } from '../services/apiService';
import BillCard from '../components/BillCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import type { BillRecommendation, RecommendationMethod } from '../types';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';

type RecommendationsScreenProps = StackScreenProps<RootStackParamList, 'RecommendationsMain'>;

const RecommendationsScreen: React.FC<RecommendationsScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const [username, setUsername] = useState<string>(
    route?.params?.username || 'su_victor21'
  );
  const [availableProfiles, setAvailableProfiles] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<BillRecommendation[]>([]);
  const [method, setMethod] = useState<RecommendationMethod>('fused');
  const [limit, setLimit] = useState<number>(5);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showUsernameInput, setShowUsernameInput] = useState<boolean>(false);
  const { user } = useAuth();

  useEffect(() => {
    if (route.params?.username) {
      setUsername(route.params.username);
    }
  }, [route.params?.username]);

  useEffect(() => {
    if (!user) {
      loadProfiles();
    }
    loadRecommendations();
  }, [username, method, limit, user]);

  const loadProfiles = async (): Promise<void> => {
    try {
      const data = await getProfiles();
      setAvailableProfiles(data);
    } catch (err) {
      console.error('Failed to load profiles:', err);
    }
  };

  const loadRecommendations = async (): Promise<void> => {
    try {
      setError(null);
      if (!refreshing) {
        setLoading(true);
      }
      const normalized = (user?.username || username).trim().toLowerCase();
      const data = await getRecommendations(normalized, limit, method);
      setRecommendations(data.recommendations || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load recommendations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = (): void => {
    setRefreshing(true);
    loadRecommendations();
  };

  const handleBillPress = (bill: BillRecommendation): void => {
    navigation.navigate('BillDetail', { bill });
  };

  const handleLoad = (): void => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }
    setShowUsernameInput(false);
    loadRecommendations();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient colors={theme.gradients.header} style={styles.header}>
          <Text style={styles.headerTitle}>Recommendations</Text>
        </LinearGradient>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={theme.gradients.header} style={styles.header}>
        <Text style={styles.headerTitle}>Recommendations</Text>
        <Text style={styles.headerSubtitle}>
          Personalized bills for {user?.username || username}
        </Text>

        {!showUsernameInput && !user ? (
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setShowUsernameInput(true)}
          >
            <Ionicons name="person" size={20} color={theme.colors.accent} />
            <Text style={styles.searchButtonText}>{username}</Text>
          </TouchableOpacity>
        ) : !user ? (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter username"
              placeholderTextColor="#6b6b6b"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.searchIconButton} onPress={handleLoad}>
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
          <View style={styles.lockedChip}>
            <Ionicons name="lock-closed" size={16} color={theme.colors.accent} />
            <Text style={styles.lockedText}>{user.username}</Text>
          </View>
        )}

        <View style={styles.methodRow}>
          {(['fused', 'average', 'individual', 'blended'] as RecommendationMethod[]).map(
            (option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.methodChip,
                  method === option && styles.methodChipActive,
                ]}
                onPress={() => setMethod(option)}
              >
                <Text
                  style={[
                    styles.methodChipText,
                    method === option && styles.methodChipTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        <View style={styles.limitRow}>
          <Text style={styles.limitLabel}>Results</Text>
          <View style={styles.limitControls}>
            <TouchableOpacity
              style={styles.limitButton}
              onPress={() => setLimit((prev) => Math.max(1, prev - 1))}
            >
              <Ionicons name="remove" size={16} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.limitValue}>{limit}</Text>
            <TouchableOpacity
              style={styles.limitButton}
              onPress={() => setLimit((prev) => Math.min(20, prev + 1))}
            >
              <Ionicons name="add" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {error ? (
        <ErrorMessage message={error} onRetry={loadRecommendations} />
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {availableProfiles.length > 0 && !user && (
            <View style={styles.profileChips}>
              <Text style={styles.profileChipsLabel}>Try another profile:</Text>
              <View style={styles.profileChipRow}>
                {availableProfiles.slice(0, 6).map((profile) => (
                  <TouchableOpacity
                    key={profile}
                    style={styles.profileChip}
                    onPress={() => {
                      setUsername(profile);
                      setShowUsernameInput(false);
                    }}
                  >
                    <Text style={styles.profileChipText}>{profile}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          {recommendations.length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {recommendations.length} Bills Recommended
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Method: {method}
                </Text>
              </View>
              {recommendations.map((bill) => (
                <BillCard
                  key={bill.bill_id}
                  bill={bill}
                  onPress={() => handleBillPress(bill)}
                />
              ))}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No recommendations available
              </Text>
            </View>
          )}
        </ScrollView>
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
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
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
  methodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  methodChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  methodChipActive: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.accent,
  },
  methodChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  methodChipTextActive: {
    color: theme.colors.accent,
  },
  limitRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  limitLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  limitControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  limitButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  limitValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 16,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textDark,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  profileChips: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  profileChipsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 8,
  },
  profileChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  profileChip: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  profileChipText: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 300,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});

export default RecommendationsScreen;
