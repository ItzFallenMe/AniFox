import { FlatList, StyleSheet, View } from 'react-native';

import { SectionHeader } from './ui/Primitives';
import { PosterCard } from './PosterCard';
import { spacing } from '../theme';
import type { MediaItem } from '../types';

interface TopTenRowProps {
  kicker?: string;
  title: string;
  items: MediaItem[];
  onPress: (item: MediaItem) => void;
}

/**
 * Numbered "Top 10" row — Flickv4's `topTen` home-row variant. Caps at ten so
 * the ranking always matches what the label promises.
 */
export const TopTenRow = ({ kicker, title, items, onPress }: TopTenRowProps) => {
  const ranked = items.slice(0, 10);
  if (ranked.length === 0) return null;

  return (
    <View style={styles.row}>
      <SectionHeader kicker={kicker} title={title} />
      <FlatList
        horizontal
        data={ranked}
        keyExtractor={item => `${item.media_type}-${item.id}`}
        renderItem={({ item, index }) => (
          <PosterCard
            item={item}
            width={132}
            onPress={onPress}
            rank={index + 1}
          />
        )}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.list}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

const Separator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  row: { marginBottom: spacing.xxxl },
  list: { paddingHorizontal: spacing.xl },
  separator: { width: spacing.md },
});
