import { useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Compass, Search, TrendingUp } from 'lucide-react-native';

import { APP_INFO, isTmdbConfigured } from '../config/env';
import { usePagedCatalog } from '../hooks/usePagedCatalog';
import { colors, fonts, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import type { MediaItem } from '../types';
import { FadeInView } from '../components/animations';
import { AppHeader } from '../components/AppHeader';
import { Billboard } from '../components/Billboard';
import { Pagination } from '../components/Pagination';
import { ContinueWatchingRow } from '../components/ContinueWatchingRow';
import { PosterGrid } from '../components/PosterGrid';
import { TmdbSetup } from '../components/TmdbSetup';
import { useWatchHistory } from '../hooks/useLibrary';
import {
  EmptyState,
  ErrorState,
  IconButton,
  Kicker,
  Screen,
  SectionHeader,
  Skeleton,
} from '../components/ui/Primitives';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen = () => {
  const navigation = useNavigation<Nav>();
  const { items, page, totalPages, loading, error, goTo, retry } =
    usePagedCatalog('trendingMovies');
  const { entries: recent, remove: removeRecent } = useWatchHistory();

  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    if (!loading) setRefreshing(false);
  }, [loading]);

  const openDetail = (item: MediaItem) => navigation.navigate('Detail', { item });
  const play = (item: MediaItem) => navigation.navigate('Player', { item });

  const header = (
    <AppHeader
      right={
        <IconButton
          icon={Search}
          accessibilityLabel="Search"
          onPress={() => navigation.navigate('Main', { screen: 'Search' })}
        />
      }
    />
  );

  if (!isTmdbConfigured) {
    return (
      <Screen scroll contentStyle={styles.content}>
        {header}
        <TmdbSetup />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      contentStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            retry();
          }}
          tintColor={colors.primary}
          colors={[colors.primary]}
          progressBackgroundColor={colors.surface}
        />
      }>
      {header}

      {loading ? (
        <HomeSkeleton />
      ) : error && items.length === 0 ? (
        <ErrorState
          title="Catalog unavailable"
          message={error}
          onRetry={retry}
          retryLabel="Reload"
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="Nothing trending"
          message="TMDB has no trending titles right now. Pull to refresh in a minute."
          icon={Compass}
        />
      ) : (
        <>
          <FadeInView duration={520} offset={8}>
            <Billboard
              item={items[0]}
              kicker="Today's spotlight"
              onPlay={play}
              onInfo={openDetail}
            />
          </FadeInView>

          <ContinueWatchingRow
            entries={recent}
            onResume={entry =>
              navigation.navigate('Player', {
                item: entry.item,
                season: entry.season,
                episode: entry.episode,
                episodeName: entry.episodeName,
              })
            }
            onRemove={removeRecent}
          />

          <SectionHeader
            icon={TrendingUp}
            kicker="This week"
            title="Trending today"
            description="What's spiking in searches over the last day."
            action={
              <Kicker>
                Page {page} of {totalPages}
              </Kicker>
            }
          />

          <PosterGrid items={items} onPress={openDetail} />

          <Pagination page={page} totalPages={totalPages} onChange={goTo} />

          <View style={styles.footer}>
            <View style={styles.footerLine} />
            <Kicker>
              {APP_INFO.name} · curated by {APP_INFO.creator}
            </Kicker>
            <Text style={styles.disclaimer}>
              Metadata from TMDB. AniFox hosts no media.
            </Text>
          </View>
        </>
      )}
    </Screen>
  );
};

const HomeSkeleton = () => (
  <View>
    <Skeleton height={430} style={styles.heroSkeleton} />
    <View style={styles.skeletonHeading}>
      <Skeleton width={150} height={18} />
      <Skeleton width={220} height={11} style={styles.skeletonLine} />
    </View>
    <View style={styles.skeletonGrid}>
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} width={103} height={155} />
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  content: { paddingBottom: 120 },
  heroSkeleton: { borderRadius: 0, marginBottom: spacing.xl },
  skeletonHeading: { paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  skeletonLine: { marginTop: spacing.sm },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  footer: { alignItems: 'center', gap: spacing.sm, paddingBottom: spacing.xxl },
  footerLine: { width: 32, height: 1, backgroundColor: colors.border },
  disclaimer: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textFaint,
    textAlign: 'center',
  },
});
