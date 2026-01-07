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
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../types';
import { getProfiles, getRecommendations } from '../services/apiService';
import BillCard from '../components/BillCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import type { BillRecommendation } from '../types';

type HomeScreenProps = StackScreenProps<RootStackParamList, 'HomeMain'>;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [username, setUsername] = useState<string>('su_victor21');
  const [profiles, setProfiles] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<BillRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showUsernameInput, setShowUsernameInput] = useState<boolean>(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async (): Promise<void> => {
    try {
      const data = await getProfiles();
      setProfiles(data);
    } catch (err) {
      console.error('Failed to load profiles:', err);
    }
  };

  const handleSearch = async (searchUsername?: string | null): Promise<void> => {
    const userToSearch = searchUsername || username;
    if (!userToSearch || !userToSearch.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await getRecommendations(userToSearch.trim().toLowerCase());
      setRecommendations(data.recommendations || []);
      setShowUsernameInput(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load recommendations');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBillPress = (bill: BillRecommendation): void => {
    navigation.navigate('BillDetail', { bill });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>BillBoard</Text>
        <Text style={styles.headerSubtitle}>Discover bills that matter to you</Text>
        
        {!showUsernameInput ? (
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setShowUsernameInput(true)}
          >
            <Ionicons name="search" size={20} color="#6366f1" />
            <Text style={styles.searchButtonText}>
              {username || 'Enter username'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter username"
              placeholderTextColor="rgba(255, 255, 255, 0.7)"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.searchIconButton}
              onPress={() => handleSearch()}
            >
              <Ionicons name="checkmark" size={24} color="#fff" />
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
        )}
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
        ) : recommendations.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recommended Bills</Text>
              <Text style={styles.sectionSubtitle}>
                {recommendations.length} bills found
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
            <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateText}>
              Enter a username to see bill recommendations
            </Text>
            {profiles.length > 0 && (
              <View style={styles.profilesContainer}>
                <Text style={styles.profilesTitle}>Available profiles:</Text>
                {profiles.slice(0, 5).map((profile) => (
                  <TouchableOpacity
                    key={profile}
                    style={styles.profileChip}
                    onPress={() => {
                      setUsername(profile);
                      setShowUsernameInput(false);
                      handleSearch(profile);
                    }}
                  >
                    <Text style={styles.profileChipText}>{profile}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  searchButtonText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 12,
    color: '#fff',
    fontSize: 16,
  },
  searchIconButton: {
    padding: 12,
  },
  cancelButton: {
    padding: 12,
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
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
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
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
  },
  profilesContainer: {
    marginTop: 24,
    width: '100%',
  },
  profilesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  profileChip: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  profileChipText: {
    color: '#6366f1',
    fontWeight: '600',
  },
});

export default HomeScreen;

