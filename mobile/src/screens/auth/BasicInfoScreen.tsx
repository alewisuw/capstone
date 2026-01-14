import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { StackScreenProps } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../types';
import { theme } from '../../theme';
import { useAuth } from '../../context/AuthContext';

type BasicInfoProps = StackScreenProps<AuthStackParamList, 'BasicInfo'>;

const BasicInfoScreen: React.FC<BasicInfoProps> = () => {
  const { completeOnboarding } = useAuth();
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [ethnicity, setEthnicity] = useState('');
  const [indigenousStatus, setIndigenousStatus] = useState('');
  const [sexualOrientation, setSexualOrientation] = useState('');

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradients.auth} style={styles.header}>
        <Text style={styles.headerText}>Bill Board</Text>
      </LinearGradient>

      <ScrollView style={styles.card} contentContainerStyle={styles.cardContent}>
        <Text style={styles.title}>Basic Information</Text>
        <Text style={styles.subtitle}>
          All fields are optional and will improve recommendations.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Age</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Optional"
              placeholderTextColor="#9b9b9b"
              value={age}
              onChangeText={setAge}
            />
            <Ionicons name="chevron-down" size={16} color="#9b9b9b" />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Gender Identity</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Optional"
              placeholderTextColor="#9b9b9b"
              value={gender}
              onChangeText={setGender}
            />
            <Ionicons name="chevron-down" size={16} color="#9b9b9b" />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Ethnicity/Racial Identity</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Optional"
              placeholderTextColor="#9b9b9b"
              value={ethnicity}
              onChangeText={setEthnicity}
            />
            <Ionicons name="chevron-down" size={16} color="#9b9b9b" />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Indigenous Status</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Optional"
              placeholderTextColor="#9b9b9b"
              value={indigenousStatus}
              onChangeText={setIndigenousStatus}
            />
            <Ionicons name="chevron-down" size={16} color="#9b9b9b" />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Sexual Orientation</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Optional"
              placeholderTextColor="#9b9b9b"
              value={sexualOrientation}
              onChangeText={setSexualOrientation}
            />
            <Ionicons name="chevron-down" size={16} color="#9b9b9b" />
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={completeOnboarding}>
          <Text style={styles.primaryButtonText}>Finish</Text>
        </TouchableOpacity>
      </ScrollView>
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
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -12,
  },
  cardContent: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textDark,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 16,
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surface,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
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

export default BasicInfoScreen;
