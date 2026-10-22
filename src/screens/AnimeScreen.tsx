import { useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ANIME_CATEGORIES, useAnimeFeed, type AnimeCategory } from '../hooks/useAnimeFeed';
import { colors, fonts, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import type { MediaItem } from '../types';
import { AppHeader } from '../components/AppHeader';
import { PosterCard } from '../components/PosterCard';
import { TmdbSetup } from '../components/TmdbSetup';
import { isTmdbConfigured } from '../config/env';
import {
  Chip,
  ErrorState,
  Kicker,
  Screen,
  Skeleton,
} from '../components/ui/Primitives';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const AnimeScreen = () => {
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const [category, setCategory] = useState<AnimeCategory>('trending');
  const { items, loading, error, retry } = useAnimeFeed(category);

  const cardWidth = (width - spacing.xl * 2 - spacing.md * 2) / 3;

  const openDetail = (item: MediaItem) => navigation.navigate('Detail', { item });

  if (!isTmdbConfigured) {
    return (
      <Screen scroll contentStyle={styles.content}>
        <AppHeader subtitle="Browse" />
        <TmdbSetup />
      </Screen>
    );
  }

  const header = (
    <View>
      <AppHeader subtitle="Browse" />
      <View style={styles.pageHeader}>
        <Kicker>Japanese animation</Kicker>
        <Text style={styles.title}>Anime</Text>
        <Text style={styles.description}>
          Seasonal picks, beloved series and films worth the binge.
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}>
        {ANIME_CATEGORIES.map(option => (
          <Chip
            key={option.key}
            label={option.label}
            active={category === option.key}
            onPress={() => setCategory(option.key)}
          />
        ))}
      </ScrollView>
    </View>
  );

  if (error) {
    return (
      <Screen contentStyle={styles.content}>
        {header}
        <ErrorState message={error} onRetry={retry} />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.content}>
      <FlatList
        data={loading ? [] : items}
        keyExtractor={item => `${item.media_type}-${item.id}`}
        renderItem={({ item }) => (
          <PosterCard item={item} width={cardWidth} onPress={openDetail} compact />
        )}
        numColumns={3}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        ListEmptyComponent={
          loading ? (
            <View style={styles.gridSkeleton}>
              {Array.from({ length: 9 }).map((_, index) => (
                <Skeleton key={index} width={cardWidth} height={cardWidth * 1.48} />
              ))}
            </View>
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: 0 },
  list: { paddingBottom: 130 },
  pageHeader: { paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  title: {
    fontFamily: fonts.displayBlack,
    fontSize: 34,
    letterSpacing: -1.1,
    color: colors.text,
    marginTop: 2,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  chips: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  column: { gap: spacing.md, paddingHorizontal: spacing.xl },
  gridSkeleton: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
});
