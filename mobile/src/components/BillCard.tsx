import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Ionicons from './Icon';
import type { BillCardProps } from '../types';
import { theme } from '../theme';
import { getTagColor } from '../data/tagCategories';
import BillStatusBadge from './BillStatusBadge';

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
        <View style={styles.numberRow}>
          <View style={styles.numberGroup}>
            <Text style={styles.billNumber}>
              {bill.bill_number || `#${bill.bill_id}`}
            </Text>
            <BillStatusBadge statusCode={bill.status_code} showLabel={false} size={36} />
          </View>
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
                size={26}
                color={theme.colors.accent}
              />
            </Pressable>
          ) : null}
        </View>

        {bill.tags && bill.tags.length > 0 ? (
          <View style={styles.tagsRow}>
            {bill.tags.map((tag) => {
              const tagColor = getTagColor(tag);
              const backgroundColor = tagColor || theme.colors.surfaceMuted;
              const textColor = tagColor ? '#fff' : theme.colors.textDark;
              return (
                <View key={tag} style={[styles.tagChip, { backgroundColor }]}>
                  <Text style={[styles.tagText, { color: textColor }]}>{tag}</Text>
                </View>
              );
            })}
          </View>
        ) : null}

        <Text style={styles.fullTitle}>{bill.title}</Text>
        
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
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  billNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textDark,
    lineHeight: 28,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  numberGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fullTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textDark,
    marginBottom: 12,
    lineHeight: 22,
  },
  statusRow: {
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  tagChip: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
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
