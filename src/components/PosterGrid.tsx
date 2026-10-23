import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { PosterCard, POSTER_RATIO } from './PosterCard';
import { Skeleton } from './ui/Primitives';
import { spacing } from '../theme';
import type { MediaItem } from '../types';

interface PosterGridProps {
  items: MediaItem[];
  onPress: (item: MediaItem) => void;
  /** Skeleton cards shown while the first page loads. */
  loading?: boolean;
  skeletonCount?: number;
  columns?: number;
}

/**
 * Three-column poster grid — sarui-movies' `grid-cols-2 sm:grid-cols-3 …`
 * translated to phone widths, with matching 2:3 shimmer placeholders.
 */
export const PosterGrid = ({
  items,
  onPress,
  loading = false,
  skeletonCount = 9,
  columns = 3,
}: PosterGridProps) => {
  const { width } = useWindowDimensions();
  const cardWidth =
    (width - spacing.xl * 2 - spacing.md * (columns - 1)) / columns;

  if (loading) {
    return (
      <View style={styles.grid}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <View key={index} style={{ width: cardWidth }}>
            <Skeleton height={cardWidth * POSTER_RATIO} />
            <Skeleton width="80%" height={11} style={styles.titleSkeleton} />
            <Skeleton width="45%" height={9} style={styles.metaSkeleton} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {items.map(item => (
        <PosterCard
          key={`${item.media_type}-${item.id}`}
          item={item}
          width={cardWidth}
          onPress={onPress}
          compact
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  titleSkeleton: { marginTop: spacing.sm, borderRadius: 4 },
  metaSkeleton: { marginTop: 5, borderRadius: 4 },
});
