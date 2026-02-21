import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '../components/Icon';
import AppLogoHorizontal from '../components/AppLogoHorizontal';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../types';
import { theme } from '../theme';
import { useSaved } from '../context/SavedContext';
import { getTagColor } from '../data/tagCategories';
import BillStatusBadge from '../components/BillStatusBadge';
import GradientBackground from '../components/GradientBackground';

type BillDetailScreenProps = StackScreenProps<RootStackParamList, 'BillDetail'>;

const BillDetailScreen: React.FC<BillDetailScreenProps> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { bill } = route.params;
  const { isSaved, toggleSave } = useSaved();
  const saved = isSaved(bill.bill_id);

  // Get the bill URL - use provided URL or construct from bill_number and parliament_session
  const getBillUrl = (): string => {
    // If URL is provided in the bill data, use it
    if (bill.url) {
      return bill.url;
    }
    
    // Construct URL using Canadian Parliament format
    // Format: https://www.parl.ca/legisinfo/en/bill/{parliament-session}/{bill-number-lowercase}
    // Example: https://www.parl.ca/legisinfo/en/bill/45-1/s-244
    
    if (bill.bill_number && bill.parliament_session) {
      // Convert bill number to lowercase (e.g., "S-244" -> "s-244")
      const billNumberLower = bill.bill_number.toLowerCase();
      return `https://www.parl.ca/legisinfo/en/bill/${bill.parliament_session}/${billNumberLower}`;
    }
    
    // Fallback: if no bill_number or parliament_session, use bill_id (less ideal)
    return `https://www.parl.ca/LegisInfo/BillDetails.aspx?billId=${bill.bill_id}`;
  };

  const handleOpenBill = async () => {
    const url = getBillUrl();
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open bill URL');
    }
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
      // Parse date string to avoid timezone issues
      // If it's just a date (YYYY-MM-DD), parse it as local date
      const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        const [, year, month, day] = dateMatch;
        // Create date in local timezone to avoid day shift
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
      // Fallback for other date formats
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const renderSummary = (summary: string) => {
    const lines = summary.split('\n');
    
    // Check if text contains bullet points
    const hasBullets = lines.some(line => 
      /^[\s]*[•\-\*▪▫◦‣⁃]\s/.test(line.trim()) || 
      /^[\s]*[0-9]+[\.\)]\s/.test(line.trim())
    );

    if (!hasBullets) {
      return <Text style={styles.summary}>{summary}</Text>;
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
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <GradientBackground
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          <TouchableOpacity
            style={[styles.backButton, { top: insets.top + 20, left: 16 }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={18} color={theme.colors.accentDark} />
          </TouchableOpacity>

          <View style={styles.logoWrap}>
            <AppLogoHorizontal textSize={22} logoSize={52} />
          </View>

        </GradientBackground>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.bookmarkButton}
            onPress={() => toggleSave(bill)}
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={theme.colors.accent}
            />
          </TouchableOpacity>
          <View style={styles.titleSection}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>
                {bill.bill_number || `#${bill.bill_id}`}: {bill.title}
              </Text>
              <View style={styles.statusRow}>
                <BillStatusBadge
                  statusCode={bill.status_code}
                  size={28}
                  showPhaseTag
                  enableTooltip
                  labelStyle={styles.statusLabel}
                  containerStyle={styles.statusContainer}
                />
              </View>
              {bill.last_updated && (
                <View style={styles.lastUpdatedContainer}>
                  <Ionicons name="time-outline" size={14} color={theme.colors.textMuted} />
                  <Text style={styles.lastUpdatedText}>
                    Last updated: {formatDate(bill.last_updated)}
                  </Text>
                </View>
              )}
            </View>
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

          <View style={styles.summarySection}>
            <Text style={styles.summaryLabel}>Summary</Text>
            {renderSummary(bill.summary)}
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle" size={20} color={theme.colors.accentDark} />
              <Text style={styles.infoText}>
                Bill uses AI generated summaries, make sure to refer to full bill below for most accurate information.
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.viewBillButton}
            onPress={handleOpenBill}
            activeOpacity={0.7}
          >
            <Ionicons name="open-outline" size={20} color="#fff" />
            <Text style={styles.viewBillButtonText}>View Full Bill</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    padding: 24,
    paddingBottom: 36,
    alignItems: 'center',
    gap: 14,
  },
  backButton: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    width: '100%',
    alignItems: 'flex-end',
    paddingRight: 16,
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
  card: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginTop: -12,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  titleSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textDark,
    lineHeight: 32,
    marginBottom: 8,
    paddingRight: 48,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statusRow: {
    marginBottom: 10,
  },
  statusContainer: {
    gap: 10,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textDark,
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
  lastUpdatedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  lastUpdatedText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  summarySection: {
    marginBottom: 24,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textDark,
    marginBottom: 12,
  },
  summaryContainer: {
    marginBottom: 0,
  },
  summary: {
    fontSize: 16,
    color: theme.colors.textMuted,
    lineHeight: 24,
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: theme.colors.accent,
    marginTop: 8,
    marginRight: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textMuted,
    lineHeight: 24,
  },
  infoSection: {
    backgroundColor: theme.colors.surfaceMuted,
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
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  viewBillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  viewBillButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
});

export default BillDetailScreen;
