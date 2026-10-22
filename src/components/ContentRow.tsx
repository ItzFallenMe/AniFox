import { FlatList, StyleSheet, View } from 'react-native';

import { SectionHeader } from './ui/Primitives';
import { PosterCard } from './PosterCard';
import { spacing } from '../theme';
import type { MediaItem } from '../types';

interface ContentRowProps {
  kicker?: string;
  title: string;
  items: MediaItem[];
  onPress: (item: MediaItem) => void;
}

export const ContentRow = ({ kicker, title, items, onPress }: ContentRowProps) => {
  if (items.length === 0) return null;

  return (
    <View style={styles.row}>
      <SectionHeader kicker={kicker} title={title} />
      <FlatList
        horizontal
        data={items}
        keyExtractor={item => `${item.media_type}-${item.id}`}
        renderItem={({ item }) => <PosterCard item={item} onPress={onPress} />}
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
