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
  const visibleTags = bill.tags?.slice(0, 2) ?? [];
  const extraTagsCount = bill.tags && bill.tags.length > 2 ? bill.tags.length - 2 : 0;

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return '';
    const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      const [, year, month, day] = dateMatch;
      return `${month}/${day}/${year}`;
    }
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const updatedDate = formatDate(bill.last_updated);

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.containerPressed]}
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
            android_ripple={{ color: 'rgba(0, 0, 0, 0.08)', borderless: true }}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={26}
              color={theme.colors.accent}
            />
          </Pressable>
        ) : null}

        <View style={styles.titleRow}>
          <Text style={styles.fullTitle} numberOfLines={3} ellipsizeMode="tail">
            {bill.title}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.billNumber}>
              {bill.bill_number || `#${bill.bill_id}`}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <BillStatusBadge
              statusCode={bill.status_code}
              showLabel={false}
              showPhaseTag
              enableTooltip
              size={20}
            />
          </View>
          {updatedDate ? (
            <View style={styles.metaItem}>
              <Text style={styles.metaText}>Updated {updatedDate}</Text>
            </View>
          ) : null}
        </View>

        {visibleTags.length > 0 ? (
          <View style={styles.tagsRow}>
            {visibleTags.map((tag) => {
              const tagColor = getTagColor(tag);
              const backgroundColor = tagColor || theme.colors.surfaceMuted;
              const textColor = tagColor ? '#fff' : theme.colors.textDark;
              return (
                <View key={tag} style={[styles.tagChip, { backgroundColor }]}>
                  <Text style={[styles.tagText, { color: textColor }]}>{tag}</Text>
                </View>
              );
            })}
            {extraTagsCount > 0 ? (
              <View style={[styles.tagChip, styles.extraTagChip]}>
                <Text style={[styles.tagText, styles.extraTagText]}>+{extraTagsCount}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        
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
  containerPressed: {
    transform: [{ scale: 0.985 }, { translateY: 1 }],
    shadowOpacity: 0.04,
    elevation: 2,
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    position: 'relative',
  },
  bookmarkButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  billNumber: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textDark,
    lineHeight: 22,
  },
  titleRow: {
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingRight: 44,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  fullTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textDark,
    lineHeight: 24,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: theme.spacing.sm,
  },
  tagChip: {
    borderRadius: 12,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  extraTagChip: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  extraTagText: {
    color: theme.colors.textMuted,
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
    marginRight: theme.spacing.xs,
  },
});

export default BillCard;
