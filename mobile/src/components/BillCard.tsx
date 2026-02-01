import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Ionicons from './Icon';
import type { BillCardProps } from '../types';
import { theme } from '../theme';

const BillCard: React.FC<BillCardProps> = ({
  bill,
  onPress,
  isSaved = false,
  onToggleSave,
}) => {
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Pressable 
      style={styles.container}
      onPress={onPress}
      android_ripple={{ color: 'rgba(0, 0, 0, 0.05)' }}
    >
      <View style={styles.card}>
        {onToggleSave ? (
          <Pressable
            style={styles.bookmarkButton}
            onPress={(event) => {
              event.stopPropagation();
              onToggleSave(bill);
            }}
            hitSlop={8}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={theme.colors.accent}
            />
          </Pressable>
        ) : null}
        
        <Text style={styles.title}>
          {bill.bill_number || `#${bill.bill_id}`}: {bill.title}
        </Text>
        
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
    </Pressable>
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
  bookmarkButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: 8,
    paddingRight: 48,
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
