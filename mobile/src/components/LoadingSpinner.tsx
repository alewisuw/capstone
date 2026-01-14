import React from 'react';
import { View, ActivityIndicator, StyleSheet, ActivityIndicatorProps } from 'react-native';
import type { LoadingSpinnerProps } from '../types';
import { theme } from '../theme';

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'large', 
  color = theme.colors.accent 
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default LoadingSpinner;
