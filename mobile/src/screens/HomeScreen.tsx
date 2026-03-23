import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '../components/Icon';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../types';
import { searchBills } from '../services/apiService';
import BillCard from '../components/BillCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import AppLogo from '../components/AppLogo';
import BillCardSkeleton from '../components/BillCardSkeleton';
import type { BillRecommendation } from '../types';
import { theme } from '../theme';
import { useSaved } from '../context/SavedContext';
import GradientBackground from '../components/GradientBackground';
import SearchBar from '../components/SearchBar';

type HomeScreenProps = StackScreenProps<RootStackParamList, 'HomeMain'>;

type FilterKey = 'all' | 'in_progress' | 'assented' | 'new';
type SortKey = 'relevance' | 'recent';
type SearchMode = 'semantic' | 'title';

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isSaved, toggleSave } = useSaved();
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<BillRecommendation[]>([]);
  const [currentLimit, setCurrentLimit] = useState<number>(20);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [activeSort, setActiveSort] = useState<SortKey>('relevance');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showSorts, setShowSorts] = useState<boolean>(false);
  const [searchMode, setSearchMode] = useState<SearchMode>('semantic');

  const handleSearch = async (term?: string | null, append: boolean = false): Promise<void> => {
    const searchTerm = term || query;
    if (!searchTerm || !searchTerm.trim()) {
      Alert.alert('Error', 'Please enter a search query');
      return;
    }

    // Reset if it's a new search
    if (!append) {
      setCurrentSearchTerm(searchTerm.trim());
      setCurrentLimit(20);
      setHasMore(true);
      setResults([]);
    }

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }
    
    try {
      const limit = 20;
      const nextOffset = append ? currentLimit : 0;
      const data = await searchBills(searchTerm.trim(), limit, nextOffset, searchMode);
      
      if (append) {
        // Append new results, avoiding duplicates
        const existingIds = new Set(results.map(b => b.bill_id));
        const newBills = data.filter(b => !existingIds.has(b.bill_id));
        setResults([...results, ...newBills]);
        const nextTotal = currentLimit + newBills.length;
        setCurrentLimit(nextTotal);
        setHasMore(data.length === limit);
      } else {
        setResults(data || []);
        setCurrentLimit(data.length);
        setHasMore(data.length === limit);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to search bills');
      if (!append) {
        setResults([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && currentSearchTerm) {
      handleSearch(currentSearchTerm, true);
    }
  }, [loadingMore, hasMore, currentSearchTerm, searchMode]);

  const isInProgress = (statusCode?: string | null): boolean => {
    if (!statusCode) return false;
    const normalized = statusCode.toLowerCase();
    if (normalized === 'royalassentgiven') return false;
    if (normalized === 'outsideorderprecedence') return false;
    if (normalized === 'billdefeated' || normalized === 'willnotbeproceededwith') return false;
    return true;
  };

  const isAssented = (statusCode?: string | null): boolean =>
    statusCode?.toLowerCase() === 'royalassentgiven';

  const isNewBill = (bill: BillRecommendation): boolean =>
    bill.is_new_bill === 1 || bill.is_new_bill === true;

  const applyFilters = (list: BillRecommendation[]): BillRecommendation[] => {
    switch (activeFilter) {
      case 'in_progress':
        return list.filter((bill) => isInProgress(bill.status_code));
      case 'assented':
        return list.filter((bill) => isAssented(bill.status_code));
      case 'new':
        return list.filter((bill) => isNewBill(bill));
      default:
        return list;
    }
  };

  const applySort = (list: BillRecommendation[]): BillRecommendation[] => {
    if (activeSort === 'recent') {
      return [...list].sort((a, b) => {
        const aTime = a.last_updated ? new Date(a.last_updated).getTime() : 0;
        const bTime = b.last_updated ? new Date(b.last_updated).getTime() : 0;
        return bTime - aTime;
      });
    }
    return list;
  };

  const filteredResults = applySort(applyFilters(results));
  const hasActiveFilters = activeFilter !== 'all' || activeSort !== 'relevance';
  const sortActive = showSorts;
  const filterActive = showFilters;

  const handleBillPress = (bill: BillRecommendation): void => {
    navigation.navigate('BillDetail', { bill });
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <GradientBackground
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <Text style={styles.headerTitle}>Search Bills</Text>
        {null}
        <View style={[styles.topRightLogo, { top: insets.top + 10 }]}>
          <AppLogo width={44} height={44} />
        </View>

        <SearchBar
          value={query}
          placeholder={searchMode === 'semantic' ? 'Search by topic, issue, or phrase' : 'Search by bill title or number'}
          onChangeText={setQuery}
          onSubmit={() => handleSearch()}
          onActionPress={() => handleSearch()}
          onClear={() => {
            setQuery('');
            setCurrentSearchTerm('');
            setResults([]);
            setError(null);
            setHasMore(false);
          }}
        />

        <View style={styles.searchModeRow}>
          {([
            { key: 'semantic', label: 'Topic Search' },
            { key: 'title', label: 'Title Search' },
          ] as const).map((mode) => (
            <Pressable
              key={mode.key}
              style={({ pressed }) => [
                styles.searchModeChip,
                searchMode === mode.key && styles.searchModeChipActive,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => {
                if (searchMode !== mode.key) {
                  setSearchMode(mode.key);
                  setResults([]);
                  setCurrentSearchTerm('');
                  setHasMore(true);
                }
              }}
            >
              <Ionicons
                name={mode.key === 'semantic' ? 'sparkles' : 'text'}
                size={14}
                color={searchMode === mode.key ? '#fff' : 'rgba(255,255,255,0.8)'}
              />
              <Text style={[
                styles.searchModeChipText,
                searchMode === mode.key && styles.searchModeChipTextActive,
              ]}>
                {mode.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </GradientBackground>

      {loading && results.length === 0 ? (
        <BillCardSkeleton count={4} />
      ) : error && results.length === 0 ? (
        <ErrorMessage 
          message={error} 
          onRetry={() => handleSearch()}
        />
      ) : results.length > 0 ? (
        <FlatList
          data={filteredResults}
          keyExtractor={(item) => item.bill_id.toString()}
          renderItem={({ item }) => (
            <BillCard
              bill={item}
              onPress={() => handleBillPress(item)}
              isSaved={isSaved(item.bill_id)}
              onToggleSave={toggleSave}
            />
          )}
          ListHeaderComponent={() => (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Search Results</Text>
              </View>
              <View style={styles.controlRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.controlButton,
                    sortActive && styles.controlButtonActive,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => {
                    setShowSorts((prev) => !prev);
                    setShowFilters(false);
                  }}
                  android_ripple={{ color: 'rgba(193,0,0,0.10)' }}
                >
                  <Ionicons name="swap-vertical" size={16} color={sortActive ? '#fff' : theme.colors.accent} />
                  <Text style={[styles.controlText, sortActive && styles.controlTextActive]}>
                    Sort
                  </Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.controlButton,
                    filterActive && styles.controlButtonActive,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => {
                    setShowFilters((prev) => !prev);
                    setShowSorts(false);
                  }}
                  android_ripple={{ color: 'rgba(193,0,0,0.10)' }}
                >
                  <Text style={[styles.controlText, filterActive && styles.controlTextActive]}>
                    Filter
                  </Text>
                  <Ionicons name="funnel-outline" size={16} color={filterActive ? '#fff' : theme.colors.accent} />
                </Pressable>
              </View>
              {showSorts ? (
                <View style={styles.optionRow}>
                  {([
                    { key: 'relevance', label: 'Relevant' },
                    { key: 'recent', label: 'Recent' },
                  ] as const).map((sort) => (
                    <Pressable
                      key={sort.key}
                      style={({ pressed }) => [
                        styles.optionChip,
                        activeSort === sort.key && styles.optionChipActive,
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={() => setActiveSort(sort.key)}
                      android_ripple={{ color: 'rgba(193,0,0,0.10)' }}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          activeSort === sort.key && styles.optionChipTextActive,
                        ]}
                      >
                        {sort.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              {showFilters ? (
                <View style={styles.optionRow}>
                  {([
                    { key: 'all', label: 'All' },
                    { key: 'in_progress', label: 'In Progress' },
                    { key: 'assented', label: 'In Law' },
                    { key: 'new', label: 'New' },
                  ] as const).map((filter) => (
                    <Pressable
                      key={filter.key}
                      style={({ pressed }) => [
                        styles.optionChip,
                        activeFilter === filter.key && styles.optionChipActive,
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={() => setActiveFilter(filter.key)}
                      android_ripple={{ color: 'rgba(193,0,0,0.10)' }}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          activeFilter === filter.key && styles.optionChipTextActive,
                        ]}
                      >
                        {filter.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              {hasActiveFilters && filteredResults.length === 0 ? (
                <View style={styles.emptyStateSmall}>
                  <Ionicons name="filter" size={28} color="#d1d5db" />
                  <Text style={styles.emptyStateSmallText}>
                    Try broadening filters to ensure more bills are found
                  </Text>
                </View>
              ) : null}
            </View>
          )}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <LoadingSpinner />
              </View>
            ) : null
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.contentContainer}
          style={styles.content}
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Try a Quick Search:</Text>
            <FlatList
              horizontal
              data={['Climate', 'Healthcare', 'Housing', 'Education', 'Taxes']}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [styles.suggestionChip, pressed && styles.buttonPressed]}
                  onPress={() => {
                    setQuery(item);
                    handleSearch(item);
                  }}
                  android_ripple={{ color: 'rgba(193,0,0,0.10)' }}
                >
                  <Text style={styles.suggestionChipText}>{item}</Text>
                </Pressable>
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsRow}
            />
          </View>
          <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyStateText}>
            Search for a topic to see related bills
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
    paddingBottom: theme.spacing.sm,
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
    marginBottom: theme.spacing.xs,
    paddingRight: 84,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 24,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 16,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  controlButtonActive: {
    backgroundColor: theme.colors.accent,
  },
  controlText: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  controlTextActive: {
    color: '#fff',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  optionChip: {
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  optionChipActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  optionChipText: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  optionChipTextActive: {
    color: '#fff',
  },
  emptyStateSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surface,
  },
  emptyStateSmallText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    flex: 1,
  },
  loadingMore: {
    paddingVertical: theme.spacing.lg,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: theme.spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    marginTop: 12,
    minHeight: 400,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
  suggestionsContainer: {
    marginTop: 0,
    width: '100%',
    marginBottom: 16,
  },
  suggestionsRow: {
    gap: 8,
    paddingHorizontal: theme.spacing.xs,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 8,
  },
  suggestionChip: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  suggestionChipText: {
    color: theme.colors.accent,
    fontWeight: '600',
  },
  searchModeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  searchModeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'transparent',
  },
  searchModeChipActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: '#fff',
  },
  searchModeChipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  searchModeChipTextActive: {
    color: '#fff',
  },
});

export default HomeScreen;
