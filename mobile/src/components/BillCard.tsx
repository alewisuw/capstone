import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BillCardProps } from '../types';
import { theme } from '../theme';

const BillCard: React.FC<BillCardProps> = ({ bill, onPress }) => {
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.card}>
        <View style={styles.accentBar} />
        <View style={styles.header}>
          <View style={styles.billIdContainer}>
            <Text style={styles.billIdText}>Bill #{bill.bill_id}</Text>
          </View>
          {bill.score !== null && bill.score !== undefined && (
            <View style={styles.scoreContainer}>
              <Ionicons name="star" size={14} color={theme.colors.accent} />
              <Text style={styles.scoreText}>{(bill.score * 100).toFixed(0)}%</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.title}>{bill.title}</Text>
        
        <Text style={styles.summary} numberOfLines={3}>
          {truncateText(bill.summary, 150)}
        </Text>
        
        <View style={styles.footer}>
          <View style={styles.readMoreContainer}>
            <Text style={styles.readMoreText}>Read More</Text>
            <Ionicons name="arrow-forward" size={16} color={theme.colors.accent} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: 16,
  },
  accentBar: {
    height: 3,
    backgroundColor: theme.colors.accent,
    borderRadius: 999,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  billIdContainer: {
    backgroundColor: theme.colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  billIdText: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreText: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: 8,
    lineHeight: 24,
  },
  summary: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMoreText: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
});

export default BillCard;
