import { RefreshControl, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search } from 'lucide-react-native';

import { isTmdbConfigured, APP_INFO } from '../config/env';
import { useHomeFeed } from '../hooks/useHomeFeed';
import { colors, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import type { MediaItem } from '../types';
import { AppHeader } from '../components/AppHeader';
import { HeroCarousel } from '../components/HeroCarousel';
import { ContentRow } from '../components/ContentRow';
import { TopTenRow } from '../components/TopTenRow';
import { TmdbSetup } from '../components/TmdbSetup';
import {
  ErrorState,
  IconButton,
  Kicker,
  Screen,
  Skeleton,
} from '../components/ui/Primitives';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen = () => {
  const navigation = useNavigation<Nav>();
  const { hero, rows, loading, refreshing, error, refresh, retry } = useHomeFeed();

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
          onRefresh={refresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
          progressBackgroundColor={colors.surface}
        />
      }>
      {header}

      {loading ? (
        <HomeSkeleton />
      ) : error && hero.length === 0 ? (
        <ErrorState
          title="Catalog unavailable"
          message={error}
          onRetry={retry}
          retryLabel="Reload"
        />
      ) : (
        <>
          <HeroCarousel items={hero} onPlay={play} onInfo={openDetail} />

          <View style={styles.rows}>
            {rows.map(row =>
              row.variant === 'topTen' ? (
                <TopTenRow
                  key={row.key}
                  kicker={row.kicker}
                  title={row.title}
                  items={row.items}
                  onPress={openDetail}
                />
              ) : (
                <ContentRow
                  key={row.key}
                  kicker={row.kicker}
                  title={row.title}
                  items={row.items}
                  onPress={openDetail}
                />
              ),
            )}
          </View>

          <View style={styles.footer}>
            <View style={styles.footerLine} />
            <Kicker>{APP_INFO.name} · curated by {APP_INFO.creator}</Kicker>
          </View>
        </>
      )}
    </Screen>
  );
};

const HomeSkeleton = () => (
  <View>
    <Skeleton height={486} style={styles.heroSkeleton} />
    {[0, 1].map(row => (
      <View key={row} style={styles.skeletonRow}>
        <Skeleton width={140} height={14} style={styles.skeletonTitle} />
        <View style={styles.skeletonCards}>
          {[0, 1, 2].map(card => (
            <Skeleton key={card} width={118} height={175} />
          ))}
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  content: { paddingBottom: 120 },
  rows: { marginTop: spacing.sm },
  footer: { alignItems: 'center', gap: spacing.md, paddingBottom: spacing.xxl },
  footerLine: { width: 32, height: 1, backgroundColor: colors.border },
  heroSkeleton: { borderRadius: 0, marginBottom: spacing.xxl },
  skeletonRow: { paddingHorizontal: spacing.xl, marginBottom: spacing.xxxl },
  skeletonTitle: { marginBottom: spacing.md },
  skeletonCards: { flexDirection: 'row', gap: spacing.md },
});
