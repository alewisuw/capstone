import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '../components/Icon';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../types';
import { getRecommendations, getMyRecommendations, getProfiles } from '../services/apiService';
import BillCard from '../components/BillCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import AppLogo from '../components/AppLogo';
import BillCardSkeleton from '../components/BillCardSkeleton';
import type { BillRecommendation } from '../types';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useSaved } from '../context/SavedContext';
import GradientBackground from '../components/GradientBackground';

type RecommendationsScreenProps = StackScreenProps<RootStackParamList, 'RecommendationsMain'>;

const RecommendationsScreen: React.FC<RecommendationsScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState<string>(
    route?.params?.username || 'su_victor21'
  );
  const [availableProfiles, setAvailableProfiles] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<BillRecommendation[]>([]);
  const [currentLimit, setCurrentLimit] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showUsernameInput, setShowUsernameInput] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const { user, authToken } = useAuth();
  const { isSaved, toggleSave } = useSaved();

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
  }, [username, user]);

  const loadProfiles = async (): Promise<void> => {
    try {
      const data = await getProfiles();
      setAvailableProfiles(data);
    } catch (err) {
      console.error('Failed to load profiles:', err);
    }
  };

  const loadRecommendations = async (append: boolean = false): Promise<void> => {
    try {
      setError(null);
      if (!refreshing && !append) {
        setLoading(true);
      }
      if (append) {
        setLoadingMore(true);
      }

      const limit = append ? currentLimit + 10 : 10;

      if (user && authToken) {
        const data = await getMyRecommendations(authToken, limit);
        const newRecommendations = data.recommendations || [];
        
        if (append) {
          const existingIds = new Set(recommendations.map(b => b.bill_id));
          const newBills = newRecommendations.filter(b => !existingIds.has(b.bill_id));
          setRecommendations([...recommendations, ...newBills]);
          setCurrentLimit(limit);
          setHasMore(newBills.length > 0 && newRecommendations.length === limit);
        } else {
          setRecommendations(newRecommendations);
          setCurrentLimit(limit);
          setHasMore(newRecommendations.length === limit);
        }
        return;
      }
      if (user && !authToken) {
        setError('Missing session. Please sign in again.');
        return;
      }
      const normalized = (user?.username || username).trim().toLowerCase();
      const data = await getRecommendations(normalized, limit);
      const newRecommendations = data.recommendations || [];
      
      if (append) {
        const existingIds = new Set(recommendations.map(b => b.bill_id));
        const newBills = newRecommendations.filter(b => !existingIds.has(b.bill_id));
        setRecommendations([...recommendations, ...newBills]);
        setCurrentLimit(limit);
        setHasMore(newBills.length > 0 && newRecommendations.length === limit);
      } else {
        setRecommendations(newRecommendations);
        setCurrentLimit(limit);
        setHasMore(newRecommendations.length === limit);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load recommendations');
      if (!append) {
        setRecommendations([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !refreshing) {
      loadRecommendations(true);
    }
  }, [loadingMore, hasMore, refreshing]);

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
      <SafeAreaView style={styles.container} edges={[]}>
        <GradientBackground
          style={[styles.header, { paddingTop: insets.top + 10 }]}
        >
          <Text style={styles.headerTitle}>Recommendations</Text>
        </GradientBackground>
        <BillCardSkeleton count={4} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <GradientBackground
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <Text style={styles.headerTitle}>Recommendations</Text>
        <Text style={styles.headerSubtitle}>
          Personalized bills for {user?.username || username}
        </Text>
        <View style={[styles.topRightLogo, { top: insets.top + 10 }]}>
          <AppLogo width={44} height={44} />
        </View>

        {!showUsernameInput && !user ? (
          <Pressable
            style={({ pressed }) => [styles.searchButton, pressed && styles.buttonPressed]}
            onPress={() => setShowUsernameInput(true)}
            android_ripple={{ color: 'rgba(0, 0, 0, 0.06)' }}
          >
            <Ionicons name="person" size={20} color={theme.colors.accent} />
            <Text style={styles.searchButtonText}>{username}</Text>
          </Pressable>
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
            <Pressable
              style={({ pressed }) => [styles.searchIconButton, pressed && styles.buttonPressed]}
              onPress={handleLoad}
              android_ripple={{ color: 'rgba(193,0,0,0.12)', borderless: true }}
            >
              <Ionicons name="checkmark" size={24} color={theme.colors.accent} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.cancelButton, pressed && styles.buttonPressed]}
              onPress={() => {
                setShowUsernameInput(false);
                setError(null);
              }}
              android_ripple={{ color: 'rgba(255,255,255,0.14)', borderless: true }}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>
        ) : null}

        {null}
      </GradientBackground>

      {error && recommendations.length === 0 ? (
        <ErrorMessage message={error} onRetry={() => loadRecommendations(false)} />
      ) : (
        <FlatList
          data={recommendations}
          keyExtractor={(item) => item.bill_id.toString()}
          renderItem={({ item }) => (
            <BillCard
              bill={item}
              onPress={() => handleBillPress(item)}
              isSaved={isSaved(item.bill_id)}
              onToggleSave={toggleSave}
            />
          )}
          ListHeaderComponent={
            <>
              {availableProfiles.length > 0 && !user && (
                <View style={styles.profileChips}>
                  <Text style={styles.profileChipsLabel}>Try another profile:</Text>
                  <View style={styles.profileChipRow}>
                    {availableProfiles.slice(0, 6).map((profile) => (
                      <Pressable
                        key={profile}
                        style={({ pressed }) => [styles.profileChip, pressed && styles.buttonPressed]}
                        onPress={() => {
                          setUsername(profile);
                          setShowUsernameInput(false);
                        }}
                        android_ripple={{ color: 'rgba(193,0,0,0.10)' }}
                      >
                        <Text style={styles.profileChipText}>{profile}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
              {recommendations.length > 0 && (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    For You
                  </Text>
                </View>
              )}
            </>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <LoadingSpinner />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No recommendations available
                </Text>
              </View>
            ) : null
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.contentContainer}
          style={styles.content}
        />
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
    paddingBottom: theme.spacing.sm,
  },
  topRightLogo: {
    position: 'absolute',
    right: 14,
    top: 55,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
    marginBottom: theme.spacing.xs,
    paddingRight: 84,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.82)',
    marginBottom: 16,
    paddingRight: 84,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginRight: 84,
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
    marginTop: 12,
    marginRight: 84,
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
    borderRadius: 12,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 12,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 16,
  },
  loadingMore: {
    paddingVertical: theme.spacing.lg,
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
    paddingVertical: theme.spacing.xs,
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
    padding: theme.spacing.lg,
    minHeight: 300,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});

export default RecommendationsScreen;
