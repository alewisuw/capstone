import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '../../components/Icon';
import type { StackScreenProps } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../types';
import { theme } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import AppLogo from '../../components/AppLogo';
import { interestGroups } from '../../data/interestGroups';

type InterestsProps = StackScreenProps<AuthStackParamList, 'Interests'>;

const InterestsScreen: React.FC<InterestsProps> = ({ navigation, route }) => {
  const { completeOnboarding } = useAuth();
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return interestGroups;
    }
    return interestGroups
      .map((group) => ({
        ...group,
        tags: group.tags.filter((tag) => tag.toLowerCase().includes(term)),
      }))
      .filter((group) => group.tags.length > 0);
  }, [search]);

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const toggleTag = (tag: string) => {
    setSelected((prev) => ({ ...prev, [tag]: !prev[tag] }));
  };

  const selectedTags = useMemo(
    () => Object.entries(selected).filter(([, value]) => value).map(([tag]) => tag),
    [selected]
  );

  const handleComplete = async () => {
    setError(null);
    const result = await completeOnboarding(route.params.demographics, selectedTags);
    if (!result.ok && result.error) {
      setError(result.error);
    }
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

      <ScrollView style={styles.card} contentContainerStyle={styles.cardContent}>
        <Text style={styles.title}>What are you interested in?</Text>
        <Text style={styles.subtitle}>Select your areas of interest to follow.</Text>

        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color="#b0b0b0" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search interests"
            placeholderTextColor="#9b9b9b"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.groupList}>
          {filteredGroups.map((group) => {
            const isExpanded = search.trim().length > 0 || expandedGroups[group.title];
            return (
              <View key={group.title} style={styles.groupSection}>
                <TouchableOpacity
                  style={styles.groupHeader}
                  onPress={() => toggleGroup(group.title)}
                >
                  <Text style={styles.groupTitle}>{group.title}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={theme.colors.textMuted}
                  />
                </TouchableOpacity>
                {isExpanded ? (
                  <View style={styles.tagWrap}>
                    {group.tags.map((tag) => {
                      const isSelected = !!selected[tag];
                      return (
                        <TouchableOpacity
                          key={tag}
                          style={[styles.tagChip, isSelected && styles.tagChipSelected]}
                          onPress={() => toggleTag(tag)}
                        >
                          <Text
                            style={[
                              styles.tagText,
                              isSelected && styles.tagTextSelected,
                            ]}
                          >
                            {tag}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.primaryButton} onPress={handleComplete}>
          <Text style={styles.primaryButtonText}>Complete</Text>
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#fff',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textDark,
  },
  groupList: {
    marginTop: 16,
  },
  groupSection: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textDark,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    backgroundColor: '#fff',
  },
  tagChipSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accent,
  },
  tagText: {
    fontSize: 12,
    color: theme.colors.textDark,
    fontWeight: '600',
  },
  tagTextSelected: {
    color: '#fff',
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
});

export default InterestsScreen;
