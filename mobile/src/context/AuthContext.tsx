import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
} from 'amazon-cognito-identity-js';

import { cognitoConfig } from '../config/cognito';
import { getMyProfile, putMyProfile } from '../services/apiService';

type AuthUser = {
  username: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  pendingUsername: string | null;
  pendingEmail: string | null;
  authToken: string | null;
  signIn: (
    username: string,
    password: string
  ) => Promise<{ ok: boolean; needsOnboarding: boolean; error?: string }>;
  signUp: (
    username: string,
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  confirmSignUp: (
    code: string
  ) => Promise<{ ok: boolean; needsOnboarding?: boolean; error?: string }>;
  completeOnboarding: (
    demographics?: Record<string, string>,
    interests?: string[]
  ) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const userPool = new CognitoUserPool({
  UserPoolId: cognitoConfig.userPoolId,
  ClientId: cognitoConfig.clientId,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [pendingUsername, setPendingUsername] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingPassword, setPendingPassword] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const signIn = (username: string, password: string) => {
    const normalizedUsername = username.trim().toLowerCase();
    const authDetails = new AuthenticationDetails({
      Username: normalizedUsername,
      Password: password,
    });
    const cognitoUser = new CognitoUser({
      Username: normalizedUsername,
      Pool: userPool,
    });

    return new Promise<{ ok: boolean; needsOnboarding: boolean; error?: string }>((resolve) => {
      cognitoUser.authenticateUser(authDetails, {
        onSuccess: async (session) => {
          const idToken = session.getIdToken().getJwtToken();
          const payload = session.getIdToken().decodePayload();
          const email = typeof payload?.email === 'string' ? payload.email : null;
          setAuthToken(idToken);
          setPendingUsername(normalizedUsername);
          if (email) {
            setPendingEmail(email);
          }
          try {
            const profile = await getMyProfile(idToken);
            if (profile?.onboarded) {
              setUser({ username: normalizedUsername });
              setPendingUsername(null);
              setPendingEmail(null);
              resolve({ ok: true, needsOnboarding: false });
              return;
            }
          } catch (err) {
            // Ignore missing profile; we'll create it during onboarding.
          }
          resolve({ ok: true, needsOnboarding: true });
        },
        onFailure: (err) => {
          console.error('Cognito signIn failed', err);
          const message =
            typeof err === 'object' && err && 'message' in err
              ? String((err as { message?: string }).message)
              : 'Sign in failed. Please try again.';
          resolve({ ok: false, needsOnboarding: false, error: message });
        },
      });
    });
  };

  const signUp = (username: string, email: string, password: string) => {
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    const attributes = [
      new CognitoUserAttribute({
        Name: 'email',
        Value: normalizedEmail,
      }),
    ];
    return new Promise<{ ok: boolean; error?: string }>((resolve) => {
      userPool.signUp(normalizedUsername, password, attributes, [], (err) => {
        if (err) {
          const errMessage =
            typeof err === 'object' && err && 'message' in err
              ? String((err as { message?: string }).message)
              : 'Sign up failed. Please try again.';
          const errCode =
            typeof err === 'object' && err && 'code' in err
              ? String((err as { code?: string }).code)
              : '';
          const message =
            errCode === 'UsernameExistsException'
              ? 'Username already exists. Please choose another.'
              : errMessage;
          console.error('Cognito signUp failed', err);
          resolve({ ok: false, error: message });
          return;
        }
        setPendingUsername(normalizedUsername);
        setPendingEmail(normalizedEmail);
        setPendingPassword(password);
        resolve({ ok: true });
      });
    });
  };

  const confirmSignUp = (code: string) => {
    const normalizedUsername = pendingUsername?.trim().toLowerCase();
    if (!normalizedUsername) {
      return Promise.resolve({ ok: false, error: 'No pending user to verify.' });
    }
    const cognitoUser = new CognitoUser({
      Username: normalizedUsername,
      Pool: userPool,
    });
    return new Promise<{ ok: boolean; needsOnboarding?: boolean; error?: string }>((resolve) => {
      cognitoUser.confirmRegistration(code, true, async (err) => {
        if (err) {
          const message =
            typeof err === 'object' && err && 'message' in err
              ? String((err as { message?: string }).message)
              : 'Verification failed. Please try again.';
          resolve({ ok: false, error: message });
          return;
        }
        if (pendingPassword) {
          const signInResult = await signIn(normalizedUsername, pendingPassword);
          setPendingPassword(null);
          if (!signInResult.ok) {
            resolve({ ok: false, error: signInResult.error || 'Sign in failed. Please try again.' });
            return;
          }
          resolve({ ok: true, needsOnboarding: signInResult.needsOnboarding });
          return;
        }
        resolve({ ok: true });
      });
    });
  };

  const completeOnboarding = async (
    demographics: Record<string, string> = {},
    interests: string[] = []
  ) => {
    if (pendingUsername && authToken) {
      const filteredDemographics = Object.fromEntries(
        Object.entries(demographics).filter(([, value]) => value && value.trim().length > 0)
      );
      try {
        await putMyProfile(
          {
            username: pendingUsername,
            email: pendingEmail || '',
            demographics: filteredDemographics,
            interests,
            onboarded: true,
          },
          authToken
        );
      } catch (err) {
        console.error('Failed to save profile', err);
        setUser({ username: pendingUsername });
        setPendingUsername(null);
        setPendingEmail(null);
        return { ok: false, error: 'Profile saved locally. Sync failed.' };
      }
      setUser({ username: pendingUsername });
      setPendingUsername(null);
      setPendingEmail(null);
      return { ok: true };
    }
    if (pendingUsername) {
      setUser({ username: pendingUsername });
      setPendingUsername(null);
      setPendingEmail(null);
      return { ok: false, error: 'Missing session. Signed in locally.' };
    }
    return { ok: false, error: 'Missing user session.' };
  };

  const signOut = () => {
    setUser(null);
    setPendingUsername(null);
    setPendingEmail(null);
    setPendingPassword(null);
    setAuthToken(null);
  };

  const value = useMemo(
    () => ({
      user,
      pendingUsername,
      pendingEmail,
      authToken,
      signIn,
      signUp,
      confirmSignUp,
      completeOnboarding,
      signOut,
    }),
    [user, pendingUsername, pendingEmail, authToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
