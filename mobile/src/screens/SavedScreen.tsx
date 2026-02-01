import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../types';
import { useSaved } from '../context/SavedContext';
import BillCard from '../components/BillCard';
import { theme } from '../theme';

type SavedScreenProps = StackScreenProps<RootStackParamList, 'SavedMain'>;

const SavedScreen: React.FC<SavedScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { savedBills, refreshSaved, isSaved, toggleSave } = useSaved();

  useFocusEffect(
    useCallback(() => {
      void refreshSaved();
    }, [refreshSaved])
  );

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <LinearGradient
        colors={theme.gradients.header}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <Text style={styles.headerTitle}>Saved</Text>
        <Text style={styles.headerSubtitle}>Your bookmarked bills</Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {savedBills.length > 0 ? (
          savedBills.map((bill) => (
            <BillCard
              key={bill.bill_id}
              bill={bill}
              onPress={() => navigation.navigate('BillDetail', { bill })}
              isSaved={isSaved(bill.bill_id)}
              onToggleSave={toggleSave}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No saved bills yet</Text>
            <Text style={styles.emptyText}>
              Tap the bookmark icon on a bill to add it here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});

export default SavedScreen;
