import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '../components/Icon';
import AppLogo from '../components/AppLogo';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../types';
import { theme } from '../theme';

type BillDetailScreenProps = StackScreenProps<RootStackParamList, 'BillDetail'>;

const BillDetailScreen: React.FC<BillDetailScreenProps> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { bill } = route.params;

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <LinearGradient
          colors={theme.gradients.header}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          <TouchableOpacity
            style={[styles.backButton, { top: insets.top + 20, left: 16 }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={18} color={theme.colors.accentDark} />
          </TouchableOpacity>

          <View style={styles.logoWrap}>
            <AppLogo width={44} height={44} />
          </View>

          <View style={styles.headerRow} />
        </LinearGradient>

        <View style={styles.card}>
          <View style={styles.titleSection}>
            <Ionicons name="document-text" size={24} color={theme.colors.accent} />
            <Text style={styles.title}>
              {bill.bill_number || `#${bill.bill_id}`}: {bill.title}
            </Text>
          </View>

          <View style={styles.summarySection}>
            <Text style={styles.summaryLabel}>Summary</Text>
            <Text style={styles.summary}>{bill.summary}</Text>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle" size={20} color={theme.colors.accentDark} />
              <Text style={styles.infoText}>
                bill uses AI generated summaries, make sure to refer to full bill for most accurate information
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
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
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
  headerRow: {
    width: '100%',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textDark,
    lineHeight: 32,
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
  summary: {
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
});

export default BillDetailScreen;
