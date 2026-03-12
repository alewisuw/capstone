import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '../../components/Icon';
import type { StackScreenProps } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../types';
import { theme } from '../../theme';
import AppLogo from '../../components/AppLogo';
import GradientBackground from '../../components/GradientBackground';

type InstructionsProps = StackScreenProps<AuthStackParamList, 'Instructions'>;

const InstructionsScreen: React.FC<InstructionsProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <GradientBackground style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color={theme.colors.accentDark} />
        </TouchableOpacity>
        <AppLogo width={90} height={90} />
      </GradientBackground>

      <View style={styles.card}>
        <Text style={styles.title}>How does Billboard work?</Text>

        <Text style={styles.introText}>
          All optional inputs you share help tailor your Billboard with bills that best align with your interests.
        </Text>

        <View style={styles.step}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepNumber}>1</Text>
          </View>
          <Text style={styles.stepText}>
            Share your <Text style={styles.bold}>interests</Text> to personalize
            your bill recommendations.
          </Text>
        </View>

        <View style={styles.step}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepNumber}>2</Text>
          </View>
          <Text style={styles.stepText}>
            You will then be prompted to add optional <Text style={styles.bold}>personalization features </Text>
             (like age, gender, income, housing) to further refine which bills you see.
          </Text>
        </View>

        <View style={styles.step}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepNumber}>3</Text>
          </View>
          <Text style={styles.stepText}>
            Add your <Text style={styles.bold}>Electoral District</Text> to stay up to date
            on local and regional bills.
          </Text>
        </View>

        <Text style={styles.privacyText}>
          Billboard only uses your interests and personalization details to recommend the most relevant bills to you.
          Your information is stored securely, and can be edited or removed at any time from the profile page.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Interests')}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 56,
    paddingBottom: 24,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 56,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    zIndex: 2,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    marginTop: -12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: 12,
  },
  introText: {
    marginBottom: 16,
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    color: '#fff',
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  privacyTitle: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textDark,
  },
  privacyText: {
    marginBottom: 8,
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
    color: theme.colors.textDark,
  },
  primaryButton: {
    marginTop: 24,
    backgroundColor: theme.colors.black,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default InstructionsScreen;
