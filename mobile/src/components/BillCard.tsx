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

  const renderSummary = (summary: string, maxLength: number) => {
    const truncated = truncateText(summary, maxLength);
    const lines = truncated.split('\n');
    
    // Check if text contains bullet points
    const hasBullets = lines.some(line => 
      /^[\s]*[•\-\*▪▫◦‣⁃]\s/.test(line.trim()) || 
      /^[\s]*[0-9]+[\.\)]\s/.test(line.trim())
    );

    if (!hasBullets) {
      return <Text style={styles.summary}>{truncated}</Text>;
    }

    return (
      <View style={styles.summaryContainer}>
        {lines.map((line, index) => {
          const trimmed = line.trim();
          const isBullet = /^[•\-\*▪▫◦‣⁃]\s/.test(trimmed) || /^[0-9]+[\.\)]\s/.test(trimmed);
          
          if (isBullet) {
            const bulletMatch = trimmed.match(/^([•\-\*▪▫◦‣⁃]|[0-9]+[\.\)])\s(.+)/);
            if (bulletMatch) {
              const [, bullet, content] = bulletMatch;
              return (
                <View key={index} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{content}</Text>
                </View>
              );
            }
          }
          
          if (trimmed) {
            return (
              <Text key={index} style={styles.summary}>
                {trimmed}
              </Text>
            );
          }
          
          return null;
        })}
      </View>
    );
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

        <View style={styles.statusRow}>
          <BillStatusBadge statusCode={bill.status_code} />
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
        
        {renderSummary(bill.summary, 150)}

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
  statusRow: {
    marginBottom: 10,
  },
  summaryContainer: {
    marginBottom: 12,
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
  summary: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 20,
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accent,
    marginTop: 7,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 20,
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
