import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../types';

type BillDetailScreenProps = StackScreenProps<RootStackParamList, 'BillDetail'>;

const BillDetailScreen: React.FC<BillDetailScreenProps> = ({ route }) => {
  const { bill } = route.params;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          style={styles.header}
        >
          <View style={styles.billIdContainer}>
            <Text style={styles.billIdText}>Bill #{bill.bill_id}</Text>
          </View>
          {bill.score !== null && bill.score !== undefined && (
            <View style={styles.scoreContainer}>
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Text style={styles.scoreText}>
                Match: {(bill.score * 100).toFixed(0)}%
              </Text>
            </View>
          )}
        </LinearGradient>

        <View style={styles.card}>
          <View style={styles.titleSection}>
            <Ionicons name="document-text" size={24} color="#6366f1" />
            <Text style={styles.title}>{bill.title}</Text>
          </View>

          <View style={styles.summarySection}>
            <Text style={styles.summaryLabel}>Summary</Text>
            <Text style={styles.summary}>{bill.summary}</Text>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle" size={20} color="#6b7280" />
              <Text style={styles.infoText}>
                This summary is retrieved from the database and ranked for relevance
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billIdContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  billIdText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  scoreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 32,
  },
  summarySection: {
    marginBottom: 24,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  summary: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  infoSection: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});

export default BillDetailScreen;
