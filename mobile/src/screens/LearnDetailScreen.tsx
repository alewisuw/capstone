import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../types';
import Ionicons from '../components/Icon';
import AppLogo from '../components/AppLogo';
import { theme } from '../theme';
import GradientBackground from '../components/GradientBackground';
import { learnTopics } from '../data/learnContent';

type LearnDetailScreenProps = StackScreenProps<RootStackParamList, 'LearnDetail'>;

const LearnDetailScreen: React.FC<LearnDetailScreenProps> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const topic = route.params.topic;
  const content = learnTopics[topic];

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <GradientBackground
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            { top: insets.top + 20, left: 16 },
            pressed && styles.backButtonPressed,
          ]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back to Learn"
          android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: true }}
        >
          <Ionicons name="arrow-back" size={18} color={theme.colors.accentDark} />
        </Pressable>
        <Text style={styles.headerTitle}>{content.title}</Text>
        <Text style={styles.headerSubtitle}>{content.subtitle}</Text>
        <View style={[styles.topRightLogo, { top: insets.top + 10 }]}>
          <AppLogo width={44} height={44} />
        </View>
      </GradientBackground>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {content.modules.map((module) => (
          <Pressable
            key={module.id}
            style={({ pressed }) => [
              styles.sectionCard,
              pressed && styles.cardPressed,
            ]}
            onPress={() =>
              navigation.navigate('LearnModuleDetail', {
                topic,
                moduleId: module.id,
              })
            }
            android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
          >
            <Text style={styles.sectionHeading}>{module.title}</Text>
            <Text style={styles.sectionBody}>{module.summary}</Text>
            <View style={styles.readMoreRow}>
              <Text style={styles.readMoreText}>Read More</Text>
              <Ionicons name="arrow-forward" size={16} color={theme.colors.accent} />
            </View>
          </Pressable>
        ))}
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
    padding: 16,
    paddingBottom: theme.spacing.sm,
  },
  backButton: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    zIndex: 2,
  },
  backButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: theme.spacing.xs,
    paddingLeft: 44,
    paddingRight: 84,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    paddingLeft: 44,
    paddingRight: 84,
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
    padding: 16,
    paddingBottom: 32,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: theme.spacing.xs,
  },
  readMoreText: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LearnDetailScreen;
