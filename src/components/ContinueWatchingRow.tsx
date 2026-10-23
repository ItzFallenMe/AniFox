import { FlatList, StyleSheet, View } from 'react-native';

import { PosterCard } from './PosterCard';
import { SectionHeader } from './ui/Primitives';
import { spacing } from '../theme';
import type { WatchEntry } from '../services/watchHistory';

interface ContinueWatchingRowProps {
  entries: WatchEntry[];
  onResume: (entry: WatchEntry) => void;
  onRemove: (key: string) => void;
}

const captionFor = (entry: WatchEntry): string => {
  if (entry.season != null && entry.episode != null) {
    return `S${entry.season} · E${entry.episode}`;
  }
  return 'Ready to watch';
};

/**
 * Resume rail on Home. Long-press a card to drop it from history — it is the
 * only place entries leave the list without finishing another title.
 */
export const ContinueWatchingRow = ({
  entries,
  onResume,
  onRemove,
}: ContinueWatchingRowProps) => {
  if (entries.length === 0) return null;

  return (
    <View style={styles.row}>
      <SectionHeader
        kicker="Pick up where you left off"
        title="Continue watching"
        description="Long-press a title to remove it from this list."
      />
      <FlatList
        horizontal
        data={entries.slice(0, 10)}
        keyExtractor={entry => entry.key}
        renderItem={({ item }) => (
          <PosterCard
            item={item.item}
            width={124}
            caption={captionFor(item)}
            onPress={() => onResume(item)}
            onLongPress={() => onRemove(item.key)}
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
