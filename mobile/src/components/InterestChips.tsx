import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { categoryColors, getTagCategory } from '../data/tagCategories';

type InterestChipsProps = {
  interests: string[];
  labelTransform?: (value: string) => string;
};

const InterestChips: React.FC<InterestChipsProps> = ({ interests, labelTransform }) => {
  if (!interests || interests.length === 0) return null;

  return (
    <View style={styles.container}>
      {interests.map((interest, index) => {
        if (interest === 'nan') return null;
        const category = getTagCategory(interest);
        const backgroundColor = category ? categoryColors[category] : theme.colors.surfaceMuted;
        const textColor = category ? '#ffffff' : theme.colors.textDark;
        const label = labelTransform ? labelTransform(interest) : interest;
        return (
          <View
            key={`${interest}-${index}`}
            style={[styles.chip, { backgroundColor }]}
          >
            <Text style={[styles.text, { color: textColor }]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: theme.spacing.xs,
    borderRadius: 16,
    borderWidth: 0,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default InterestChips;
