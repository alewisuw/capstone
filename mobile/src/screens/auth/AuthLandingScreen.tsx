import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { StackScreenProps } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../types';
import { theme } from '../../theme';

type AuthLandingProps = StackScreenProps<AuthStackParamList, 'AuthLanding'>;

const AuthLandingScreen: React.FC<AuthLandingProps> = ({ navigation }) => {
  return (
    <LinearGradient colors={theme.gradients.auth} style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logoCircle}>
          <Ionicons name="business" size={40} color="#fff" />
        </View>
        <Text style={styles.logoText}>Bill Board</Text>
        <Text style={styles.logoSub}>Personalized bills, focused on you.</Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 48,
  },
  hero: {
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.4,
  },
  logoSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  actions: {
    gap: 12,
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
