import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../types';
import { getRecommendations } from '../services/apiService';
import BillCard from '../components/BillCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import type { BillRecommendation } from '../types';

type RecommendationsScreenProps = StackScreenProps<RootStackParamList, 'RecommendationsMain'>;

const RecommendationsScreen: React.FC<RecommendationsScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const [username, setUsername] = useState<string>(
    route?.params?.username || 'su_victor21'
  );
  const [recommendations, setRecommendations] = useState<BillRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    if (route.params?.username) {
      setUsername(route.params.username);
    }
  }, [route.params?.username]);

  useEffect(() => {
    loadRecommendations();
  }, [username]);

  const loadRecommendations = async (): Promise<void> => {
    try {
      setError(null);
      const data = await getRecommendations(username);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Recommendations</Text>
        </View>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recommendations</Text>
        <Text style={styles.headerSubtitle}>
          Personalized bills for {username}
        </Text>
      </View>

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
          {recommendations.length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {recommendations.length} Bills Recommended
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
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#6366f1',
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
    color: '#111827',
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
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default RecommendationsScreen;

