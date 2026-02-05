import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
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
import type { BillRecommendation } from '../types';
import { theme } from '../theme';
import { useSaved } from '../context/SavedContext';
import GradientBackground from '../components/GradientBackground';

type HomeScreenProps = StackScreenProps<RootStackParamList, 'HomeMain'>;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isSaved, toggleSave } = useSaved();
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<BillRecommendation[]>([]);
  const [currentLimit, setCurrentLimit] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>('');

  const handleSearch = async (term?: string | null, append: boolean = false): Promise<void> => {
    const searchTerm = term || query;
    if (!searchTerm || !searchTerm.trim()) {
      Alert.alert('Error', 'Please enter a search query');
      return;
    }

    // Reset if it's a new search
    if (!append) {
      setCurrentSearchTerm(searchTerm.trim());
      setCurrentLimit(10);
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
      const limit = append ? currentLimit + 10 : 10;
      const data = await searchBills(searchTerm.trim(), limit);
      
      if (append) {
        // Append new results, avoiding duplicates
        const existingIds = new Set(results.map(b => b.bill_id));
        const newBills = data.filter(b => !existingIds.has(b.bill_id));
        setResults([...results, ...newBills]);
        setCurrentLimit(limit);
        setHasMore(newBills.length > 0 && data.length === limit);
      } else {
        setResults(data || []);
        setCurrentLimit(limit);
        setHasMore((data?.length || 0) === limit);
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
  }, [loadingMore, hasMore, currentSearchTerm]);

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
        <View style={styles.topRightLogo}>
          <AppLogo width={56} height={56} />
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.colors.accent} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by topic, issue, or phrase"
            placeholderTextColor="#6b6b6b"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.searchIconButton}
            onPress={() => handleSearch()}
          >
            <Ionicons name="arrow-forward" size={20} color={theme.colors.accent} />
          </TouchableOpacity>
        </View>

        {null}
      </GradientBackground>

      {loading && results.length === 0 ? (
        <LoadingSpinner />
      ) : error && results.length === 0 ? (
        <ErrorMessage 
          message={error} 
          onRetry={() => handleSearch()}
        />
      ) : results.length > 0 ? (
        <FlatList
          data={results}
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
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Search Results</Text>
            </View>
          }
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
                <TouchableOpacity
                  style={styles.suggestionChip}
                  onPress={() => {
                    setQuery(item);
                    handleSearch(item);
                  }}
                >
                  <Text style={styles.suggestionChipText}>{item}</Text>
                </TouchableOpacity>
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
    padding: 20,
    paddingTop: 10,
    paddingBottom: 18,
  },
  topRightLogo: {
    position: 'absolute',
    right: 16,
    top: 55,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.textDark,
    fontSize: 16,
  },
  searchIconButton: {
    padding: 6,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 16,
  },
  loadingMore: {
    paddingVertical: 20,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: 4,
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
    paddingHorizontal: 4,
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
});

export default HomeScreen;
