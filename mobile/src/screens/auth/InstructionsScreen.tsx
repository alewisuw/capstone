import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { StackScreenProps } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../types';
import { theme } from '../../theme';
import AppLogo from '../../components/AppLogo';

type InstructionsProps = StackScreenProps<AuthStackParamList, 'Instructions'>;

const InstructionsScreen: React.FC<InstructionsProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradients.auth} style={styles.header}>
        <AppLogo width={90} height={90} />
        <View style={styles.topRightLogo}>
          <AppLogo width={44} height={44} />
        </View>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.title}>How does Bill Board work?</Text>

        <View style={styles.step}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepNumber}>1</Text>
          </View>
          <Text style={styles.stepText}>
            Input <Text style={styles.bold}>Basic Demographic Information</Text> so we
            can recommend bills that may directly impact you. (optional)
          </Text>
        </View>

        <View style={styles.step}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepNumber}>2</Text>
          </View>
          <Text style={styles.stepText}>
            Add your <Text style={styles.bold}>Electoral District</Text> to stay up to date
            on local bills. (optional)
          </Text>
        </View>

        <View style={styles.step}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepNumber}>3</Text>
          </View>
          <Text style={styles.stepText}>
            Share any additional <Text style={styles.bold}>interests</Text> to personalize
            your recommendations.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('BasicInfo')}
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
  topRightLogo: {
    position: 'absolute',
    top: 12,
    right: 16,
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
    marginBottom: 20,
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
