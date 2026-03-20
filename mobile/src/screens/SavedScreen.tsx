import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../types';
import { useSaved } from '../context/SavedContext';
import BillCard from '../components/BillCard';
import BillCardSkeleton from '../components/BillCardSkeleton';
import AppLogo from '../components/AppLogo';
import { theme } from '../theme';
import GradientBackground from '../components/GradientBackground';

type SavedScreenProps = StackScreenProps<RootStackParamList, 'SavedMain'>;

const SavedScreen: React.FC<SavedScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { savedBills, refreshSaved, isSaved, toggleSave } = useSaved();
  const [loading, setLoading] = useState<boolean>(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      void refreshSaved()
        .catch(() => undefined)
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [refreshSaved])
  );

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <GradientBackground
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <Text style={styles.headerTitle}>Saved</Text>
        <Text style={styles.headerSubtitle}>Your bookmarked bills</Text>
        <View style={[styles.topRightLogo, { top: insets.top + 10 }]}>
          <AppLogo width={44} height={44} />
        </View>
      </GradientBackground>

      {loading ? (
        <BillCardSkeleton count={3} />
      ) : (
        <FlatList
          data={savedBills}
          keyExtractor={(item) => item.bill_id.toString()}
          renderItem={({ item }) => (
            <BillCard
              bill={item}
              onPress={() => navigation.navigate('BillDetail', { bill: item })}
              isSaved={isSaved(item.bill_id)}
              onToggleSave={toggleSave}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No saved bills yet</Text>
              <Text style={styles.emptyText}>
                Tap the bookmark icon on a bill to add it here.
              </Text>
            </View>
          }
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 16,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  topRightLogo: {
    position: 'absolute',
    right: 14,
    top: 55,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 16,
  },
  emptyState: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});

export default SavedScreen;
