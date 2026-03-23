import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '../components/Icon';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../types';
import AppLogo from '../components/AppLogo';
import { theme } from '../theme';
import GradientBackground from '../components/GradientBackground';

const startHereModules = [
  {
    title: 'How does BillBoard Work?',
    topics: '4 Topics',
    description: 'Learn how recommendations, search, saved bills, and profile preferences work together.',
  },
];

const learnMoreModules = [
  {
    title: 'Understanding Canadian Legislation',
    topics: '4 Topics',
    description: 'Follow the full legislative journey from introduction to Royal Assent.',
  },
  {
    title: 'Canadian Policy & Governance',
    topics: '3 Topics',
    description: 'Explore how public policy is made, who leads it, and how institutions are structured.',
  },
];

type LearnScreenProps = StackScreenProps<RootStackParamList, 'LearnMain'>;

const LearnScreen: React.FC<LearnScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <GradientBackground
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <Text style={styles.headerTitle}>Learn</Text>
        <Text style={styles.headerSubtitle}>
          Your guide to BillBoard, Parliament, and the legislative process
        </Text>
        <View style={[styles.topRightLogo, { top: insets.top + 10 }]}
        >
          <AppLogo width={44} height={44} />
        </View>
      </GradientBackground>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Start Here</Text>
          <Text style={styles.sectionSubtitle}>
            Quick modules to help you navigate BillBoard
          </Text>
        </View>

        {startHereModules.map((module) => (
          <Pressable
            key={module.title}
            style={({ pressed }) => [
              styles.heroCard,
              pressed && styles.cardPressed,
            ]}
            android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
            onPress={() => {
              if (module.title === 'How Does BillBoard Work?') {
                navigation.navigate('LearnDetail', { topic: 'billboard' });
              } else if (module.title === 'Understanding Canadian Legislation') {
                navigation.navigate('LearnDetail', { topic: 'legislation' });
              } else {
                navigation.navigate('LearnDetail', { topic: 'governance' });
              }
            }}
          >
            <View style={styles.heroCardHeader}>
              <Text style={styles.heroTitle}>{module.title}</Text>
              <View style={styles.heroMeta}>
                <Text style={styles.heroMetaText}>{module.topics}</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </View>
            </View>
            <Text style={styles.heroDescription}>{module.description}</Text>
          </Pressable>
        ))}

        <View style={[styles.sectionHeader, styles.sectionBlock]}>
          <Text style={styles.sectionTitle}>Learn How Government Works</Text>
          <Text style={styles.sectionSubtitle}>
            Explore how laws are made and how Canadian Parliament and government are structured.
          </Text>
        </View>

        {learnMoreModules.map((module) => (
          <Pressable
            key={module.title}
            style={({ pressed }) => [
              styles.heroCard,
              pressed && styles.cardPressed,
            ]}
            android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
            onPress={() => {
              if (module.title === 'How Does BillBoard Work?') {
                navigation.navigate('LearnDetail', { topic: 'billboard' });
              } else if (module.title === 'Understanding Canadian Legislation') {
                navigation.navigate('LearnDetail', { topic: 'legislation' });
              } else {
                navigation.navigate('LearnDetail', { topic: 'governance' });
              }
            }}
          >
            <View style={styles.heroCardHeader}>
              <Text style={styles.heroTitle}>{module.title}</Text>
              <View style={styles.heroMeta}>
                <Text style={styles.heroMetaText}>{module.topics}</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </View>
            </View>
            <Text style={styles.heroDescription}>{module.description}</Text>
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
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: theme.spacing.xs,
    paddingRight: 84,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
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
  sectionHeader: {
    marginBottom: 12,
  },
  sectionBlock: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textDark,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  heroCard: {
    backgroundColor: theme.colors.accent,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  heroCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    paddingRight: 12,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroMetaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  heroDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});

export default LearnScreen;
