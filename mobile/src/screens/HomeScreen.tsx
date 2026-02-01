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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '../components/Icon';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../types';
import { getHealth, searchBills } from '../services/apiService';
import BillCard from '../components/BillCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import AppLogo from '../components/AppLogo';
import type { BillRecommendation } from '../types';
import { theme } from '../theme';

type HomeScreenProps = StackScreenProps<RootStackParamList, 'HomeMain'>;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState<string>('climate');
  const [results, setResults] = useState<BillRecommendation[]>([]);
  const [limit, setLimit] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<'loading' | 'ok' | 'down'>('loading');

  useEffect(() => {
    loadHealth();
  }, []);

  const loadHealth = async (): Promise<void> => {
    try {
      const data = await getHealth();
      setHealthStatus(data.status === 'ok' ? 'ok' : 'down');
    } catch (err) {
      setHealthStatus('down');
    }
  };

  const handleSearch = async (term?: string | null): Promise<void> => {
    const searchTerm = term || query;
    if (!searchTerm || !searchTerm.trim()) {
      Alert.alert('Error', 'Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await searchBills(searchTerm.trim(), limit);
      setResults(data || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to search bills');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBillPress = (bill: BillRecommendation): void => {
    navigation.navigate('BillDetail', { bill });
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <LinearGradient
        colors={theme.gradients.header}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <Text style={styles.headerTitle}>Search Bills</Text>
        <Text style={styles.headerSubtitle}>Semantic search across bill summaries</Text>
        <View style={styles.topRightLogo}>
          <AppLogo width={44} height={44} />
        </View>

        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              healthStatus === 'ok' ? styles.statusOk : styles.statusDown,
            ]}
          />
          <Text style={styles.statusText}>
            API {healthStatus === 'loading' ? 'checking' : healthStatus}
          </Text>
          <TouchableOpacity style={styles.statusRefresh} onPress={loadHealth}>
            <Ionicons name="refresh" size={16} color="#fff" />
          </TouchableOpacity>
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
              onPress={() => setLimit((prev) => Math.min(10, prev + 1))}
            >
              <Ionicons name="add" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage 
            message={error} 
            onRetry={() => handleSearch()}
          />
        ) : results.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Search Results</Text>
            </View>
            {results.map((bill) => (
              <BillCard
                key={bill.bill_id}
                bill={bill}
                onPress={() => handleBillPress(bill)}
              />
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateText}>
              Search for a topic to see related bills
            </Text>
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Try a quick search:</Text>
              {['climate', 'healthcare', 'housing', 'education', 'tax'].map((term) => (
                <TouchableOpacity
                  key={term}
                  style={styles.suggestionChip}
                  onPress={() => {
                    setQuery(term);
                    handleSearch(term);
                  }}
                >
                  <Text style={styles.suggestionChipText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
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
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusOk: {
    backgroundColor: '#2ecc71',
  },
  statusDown: {
    backgroundColor: theme.colors.accent,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statusRefresh: {
    marginLeft: 'auto',
    padding: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 400,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
  suggestionsContainer: {
    marginTop: 24,
    width: '100%',
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 12,
  },
  suggestionChip: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  suggestionChipText: {
    color: theme.colors.accent,
    fontWeight: '600',
  },
});

export default HomeScreen;
