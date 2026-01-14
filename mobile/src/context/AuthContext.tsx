import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
} from 'amazon-cognito-identity-js';

import { cognitoConfig } from '../config/cognito';

type AuthUser = {
  username: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  pendingUsername: string | null;
  signIn: (username: string, password: string) => void;
  signUp: (
    username: string,
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  completeOnboarding: () => void;
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

    cognitoUser.authenticateUser(authDetails, {
      onSuccess: () => {
        setUser({ username: normalizedUsername });
      },
      onFailure: (err) => {
        console.error('Cognito signIn failed', err);
      },
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
          const message =
            typeof err === 'object' && err && 'message' in err
              ? String((err as { message?: string }).message)
              : 'Sign up failed. Please try again.';
          console.error('Cognito signUp failed', err);
          resolve({ ok: false, error: message });
          return;
        }
        setPendingUsername(normalizedUsername);
        resolve({ ok: true });
      });
    });
  };

  const completeOnboarding = () => {
    if (pendingUsername) {
      setUser({ username: pendingUsername });
      setPendingUsername(null);
    }
  };

  const signOut = () => {
    setUser(null);
    setPendingUsername(null);
  };

  const value = useMemo(
    () => ({
      user,
      pendingUsername,
      signIn,
      signUp,
      completeOnboarding,
      signOut,
    }),
    [user, pendingUsername]
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
