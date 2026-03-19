import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
  Image,
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
import { useAuth } from '../context/AuthContext';
import { getMyDistrictVote } from '../services/apiService';
import type { DistrictMpVote } from '../types';

type BillDetailScreenProps = StackScreenProps<RootStackParamList, 'BillDetail'>;

const BillDetailScreen: React.FC<BillDetailScreenProps> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { bill } = route.params;
  const { isSaved, toggleSave } = useSaved();
  const { authToken } = useAuth();
  const [districtVote, setDistrictVote] = useState<DistrictMpVote | null>(null);
  const [districtVoteLoading, setDistrictVoteLoading] = useState<boolean>(false);
  const [headshotLoadFailed, setHeadshotLoadFailed] = useState<boolean>(false);
  const saved = isSaved(bill.bill_id);

  useEffect(() => {
    let mounted = true;
    const loadDistrictVote = async () => {
      if (!authToken) {
        setDistrictVote(null);
        return;
      }
      setDistrictVoteLoading(true);
      try {
        const data = await getMyDistrictVote(authToken, bill.bill_id);
        if (mounted) {
          setDistrictVote(data);
        }
      } catch {
        if (mounted) {
          setDistrictVote(null);
        }
      } finally {
        if (mounted) {
          setDistrictVoteLoading(false);
        }
      }
    };

    loadDistrictVote();
    return () => {
      mounted = false;
    };
  }, [authToken, bill.bill_id]);

  useEffect(() => {
    setHeadshotLoadFailed(false);
  }, [districtVote?.mp_headshot_url]);

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

  const renderBoldSegments = (text: string) => {
    const parts: Array<string | JSX.Element> = [];
    const regex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      parts.push(
        <Text key={`${match.index}-${match[1]}`} style={styles.summaryBold}>
          {match[1]}
        </Text>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  const renderSummary = (summary: string) => {
    const lines = summary.split('\n');
    
    // Check if text contains bullet points
    const hasBullets = lines.some(line => 
      /^[\s]*[•\-\*▪▫◦‣⁃]\s/.test(line.trim()) || 
      /^[\s]*[0-9]+[\.\)]\s/.test(line.trim())
    );

    if (!hasBullets) {
      return <Text style={styles.summary}>{renderBoldSegments(summary)}</Text>;
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
                  <Text style={styles.bulletText}>{renderBoldSegments(content)}</Text>
                </View>
              );
            }
          }
          
          if (trimmed) {
            return (
              <Text key={index} style={styles.summary}>
                {renderBoldSegments(trimmed)}
              </Text>
            );
          }
          
          return null;
        })}
      </View>
    );
  };

  const voteToneStyle = () => {
    if (districtVote?.position === 'for') return styles.votePillFor;
    if (districtVote?.position === 'against') return styles.votePillAgainst;
    return styles.votePillNeutral;
  };

  const voteToneTextStyle = () => {
    if (districtVote?.position === 'for') return styles.votePillTextFor;
    if (districtVote?.position === 'against') return styles.votePillTextAgainst;
    return styles.votePillTextNeutral;
  };

  const voteLabel = () => {
    if (districtVote?.position === 'for') return 'Voted For';
    if (districtVote?.position === 'against') return 'Voted Against';
    if (districtVote?.position === 'abstain') return 'Paired / Abstained';
    if (districtVote?.vote) return districtVote.vote;
    return 'No Recorded Vote';
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

          <View style={styles.voteSection}>
            <Text style={styles.summaryLabel}>Your District MP Vote</Text>
            {districtVoteLoading ? (
              <View style={styles.voteLoadingRow}>
                <ActivityIndicator size="small" color={theme.colors.accent} />
                <Text style={styles.voteMetaText}>Loading vote record...</Text>
              </View>
            ) : !authToken ? (
              <Text style={styles.voteMetaText}>
                Sign in to see how your district MP voted on this bill.
              </Text>
            ) : districtVote?.available ? (
              <View style={styles.voteCard}>
                <View style={styles.voteCardRow}>
                  {districtVote.mp_headshot_url && !headshotLoadFailed ? (
                    <View style={styles.mpHeadshotFrame}>
                      <Image
                        source={{ uri: districtVote.mp_headshot_url }}
                        style={styles.mpHeadshotImage}
                        resizeMode="contain"
                        onError={() => setHeadshotLoadFailed(true)}
                      />
                    </View>
                  ) : (
                    <View style={[styles.mpHeadshotFrame, styles.mpHeadshotFallback]}>
                      <Ionicons name="person" size={18} color={theme.colors.textMuted} />
                    </View>
                  )}
                  <View style={styles.voteCardContent}>
                    <Text style={styles.voteMpName}>
                      {districtVote.mp_name || 'Unknown MP'}
                      {districtVote.mp_party ? ` (${districtVote.mp_party})` : ''}
                    </Text>
                    {districtVote.electoral_district ? (
                      <Text style={styles.voteMetaText}>District: {districtVote.electoral_district}</Text>
                    ) : null}
                    <View style={[styles.votePill, voteToneStyle()]}>
                      <Text style={[styles.votePillText, voteToneTextStyle()]}>{voteLabel()}</Text>
                    </View>
                    {districtVote.vote_date ? (
                      <Text style={styles.voteMetaText}>Vote date: {formatDate(districtVote.vote_date)}</Text>
                    ) : null}
                  </View>
                </View>
              </View>
            ) : (
              <Text style={styles.voteMetaText}>
                No district vote record is available for this bill yet.
              </Text>
            )}
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
  voteSection: {
    marginBottom: 20,
  },
  voteLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voteCard: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  voteCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  voteCardContent: {
    flex: 1,
    gap: 6,
  },
  mpHeadshotFrame: {
    width: 76,
    height: 100,
    borderRadius: 16,
    // overflow: 'hidden',
  },
  mpHeadshotImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  mpHeadshotFallback: {
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  votePill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  votePillFor: {
    backgroundColor: '#DCFCE7',
  },
  votePillAgainst: {
    backgroundColor: '#FEE2E2',
  },
  votePillNeutral: {
    backgroundColor: '#E5E7EB',
  },
  votePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  votePillTextFor: {
    color: '#166534',
  },
  votePillTextAgainst: {
    color: '#991B1B',
  },
  votePillTextNeutral: {
    color: '#374151',
  },
  voteMpName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textDark,
  },
  voteMetaText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 20,
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
  summaryBold: {
    fontWeight: '700',
    color: theme.colors.textDark,
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
