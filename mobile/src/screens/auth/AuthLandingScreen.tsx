import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { StackScreenProps } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../types';
import { theme } from '../../theme';
import AppLogo from '../../components/AppLogo';

type AuthLandingProps = StackScreenProps<AuthStackParamList, 'AuthLanding'>;

const AuthLandingScreen: React.FC<AuthLandingProps> = ({ navigation }) => {
  return (
    <LinearGradient colors={theme.gradients.auth} style={styles.container}>
      <View style={styles.topRightLogo}>
        <AppLogo width={44} height={44} />
      </View>

      <View style={styles.hero}>
        <AppLogo width={140} height={140} />
        <Text style={styles.logoSub}>
          Personalized and accessible Canadian legislation.
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.primaryButtonText}>Sign Up</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.secondaryButtonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 48,
  },
  topRightLogo: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logoSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  actions: {
    gap: 12,
    paddingBottom: 8,
  },
  primaryButton: {
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
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.accent,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AuthLandingScreen;
