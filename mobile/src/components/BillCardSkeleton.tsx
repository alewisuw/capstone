import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { theme } from '../theme';

type BillCardSkeletonProps = {
  count?: number;
};

const BillCardSkeleton: React.FC<BillCardSkeletonProps> = ({ count = 3 }) => {
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.75,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.card}>
          <Animated.View style={[styles.lineLg, { opacity: pulse }]} />
          <Animated.View style={[styles.lineMd, { opacity: pulse }]} />
          <View style={styles.metaRow}>
            <Animated.View style={[styles.metaShort, { opacity: pulse }]} />
            <Animated.View style={[styles.metaChip, { opacity: pulse }]} />
            <Animated.View style={[styles.metaShort, { opacity: pulse }]} />
          </View>
          <View style={styles.tagsRow}>
            <Animated.View style={[styles.tag, { opacity: pulse }]} />
            <Animated.View style={[styles.tag, { opacity: pulse }]} />
          </View>
          <Animated.View style={[styles.readMore, { opacity: pulse }]} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  card: {
    marginHorizontal: theme.spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
  },
  lineLg: {
    height: 20,
    borderRadius: 8,
    width: '88%',
    backgroundColor: '#dcdcdc',
    marginBottom: theme.spacing.sm,
  },
  lineMd: {
    height: 20,
    borderRadius: 8,
    width: '62%',
    backgroundColor: '#dcdcdc',
    marginBottom: theme.spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  metaShort: {
    width: 70,
    height: 14,
    borderRadius: 6,
    backgroundColor: '#d7d7d7',
  },
  metaChip: {
    width: 84,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#d0d0d0',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  tag: {
    width: 90,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d5d5d5',
  },
  readMore: {
    width: 100,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#d3d3d3',
    alignSelf: 'flex-end',
  },
});

export default BillCardSkeleton;
