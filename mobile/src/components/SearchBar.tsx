import React from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import Ionicons from './Icon';
import { theme } from '../theme';

type SearchBarProps = {
  value: string;
  placeholder?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: () => void;
  onActionPress?: () => void;
  editable?: boolean;
  disabled?: boolean;
};

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  placeholder = 'Search',
  onChangeText,
  onSubmit,
  onActionPress,
  editable = true,
  disabled = false,
}) => {
  return (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color={theme.colors.accent} />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor="#6b6b6b"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        editable={editable}
        pointerEvents={editable ? 'auto' : 'none'}
      />
      <Pressable
        style={({ pressed }) => [styles.searchIconButton, pressed && styles.buttonPressed]}
        onPress={onActionPress}
        android_ripple={{ color: 'rgba(193,0,0,0.12)', borderless: true }}
        disabled={disabled}
      >
        <Ionicons name="arrow-forward" size={20} color={theme.colors.accent} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.textDark,
    fontSize: 16,
  },
  searchIconButton: {
    padding: theme.spacing.xs,
    borderRadius: 10,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});

export default SearchBar;
