import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { StackScreenProps } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../types';
import { theme } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import AppLogo from '../../components/AppLogo';

type LoginProps = StackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC<LoginProps> = ({ navigation }) => {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    const result = await signIn(username, password);
    if (!result.ok) {
      setError(result.error || 'Sign in failed. Please try again.');
      return;
    }
    if (result.needsOnboarding) {
      navigation.navigate('Instructions');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradients.auth} style={styles.header}>
        <AppLogo width={90} height={90} />
        <View style={styles.topRightLogo}>
          <AppLogo width={44} height={44} />
        </View>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.title}>Log in to your account</Text>

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your username"
          placeholderTextColor="#9b9b9b"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#9b9b9b"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleLogin}
        >
          <Text style={styles.primaryButtonText}>Log In</Text>
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Text style={styles.footer}>
          Don't have an account?{' '}
          <Text style={styles.link} onPress={() => navigation.navigate('SignUp')}>
            Sign Up
          </Text>
        </Text>
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
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.colors.textDark,
    backgroundColor: theme.colors.surface,
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
  errorText: {
    marginTop: 12,
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    marginTop: 16,
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  link: {
    color: theme.colors.accent,
    fontWeight: '700',
  },
});

export default LoginScreen;
