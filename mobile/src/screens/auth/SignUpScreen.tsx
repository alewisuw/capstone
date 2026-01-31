import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '../../components/Icon';
import type { StackScreenProps } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../types';
import { theme } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import AppLogo from '../../components/AppLogo';

type SignUpProps = StackScreenProps<AuthStackParamList, 'SignUp'>;

const SignUpScreen: React.FC<SignUpProps> = ({ navigation }) => {
  const { signUp } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const passwordChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  const handleSignUp = async () => {
    setError(null);
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    if (!trimmedUsername || !trimmedEmail || !password) {
      setError('Username, email, and password are required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const result = await signUp(trimmedUsername, trimmedEmail, password);
    if (!result.ok) {
      setError(result.error || 'Sign up failed. Please try again.');
      return;
    }
    navigation.navigate('VerifyEmail');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradients.auth} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <AppLogo width={90} height={90} />
        <View style={styles.topRightLogo}>
          <AppLogo width={44} height={44} />
        </View>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.title}>Create your account</Text>

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter a username"
          placeholderTextColor="#9b9b9b"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#9b9b9b"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter a password"
          placeholderTextColor="#9b9b9b"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.label}>Re-enter Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Re-enter your password"
          placeholderTextColor="#9b9b9b"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        {password.length > 0 ? (
          <View style={styles.passwordChecks}>
            <Text style={styles.passwordChecksTitle}>Password must include:</Text>
            {[
              { label: 'At least 8 characters', ok: passwordChecks.length },
              { label: 'Uppercase letter', ok: passwordChecks.upper },
              { label: 'Lowercase letter', ok: passwordChecks.lower },
              { label: 'Number', ok: passwordChecks.number },
              { label: 'Symbol', ok: passwordChecks.symbol },
            ].map((check) => (
              <View key={check.label} style={styles.passwordCheckRow}>
                <Ionicons
                  name={check.ok ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={check.ok ? theme.colors.success : theme.colors.textMuted}
                />
                <Text style={[styles.passwordCheckText, check.ok && styles.passwordCheckTextOk]}>
                  {check.label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.primaryButton} onPress={handleSignUp}>
          <Text style={styles.primaryButtonText}>Sign Up</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Already have an account?{' '}
          <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
            Log In
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
  backButton: {
    position: 'absolute',
    left: 16,
    top: 56,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
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
  passwordChecks: {
    marginTop: 12,
    marginBottom: 4,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surface,
  },
  passwordChecksTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 8,
  },
  passwordCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  passwordCheckText: {
    marginLeft: 8,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  passwordCheckTextOk: {
    color: theme.colors.success,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 12,
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '600',
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

export default SignUpScreen;
