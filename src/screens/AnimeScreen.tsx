import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Compass, Film, Flame, Radio, Star } from 'lucide-react-native';

import { isTmdbConfigured } from '../config/env';
import { useAnimeSections } from '../hooks/useAnimeSections';
import { colors, fonts, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import type { MediaItem } from '../types';
import { FadeInView } from '../components/animations';
import { AppHeader } from '../components/AppHeader';
import { Billboard } from '../components/Billboard';
import { PosterGrid } from '../components/PosterGrid';
import { TmdbSetup } from '../components/TmdbSetup';
import {
  EmptyState,
  ErrorState,
  Kicker,
  Screen,
  SectionHeader,
  Skeleton,
} from '../components/ui/Primitives';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const AnimeScreen = () => {
  const navigation = useNavigation<Nav>();
  const { sections, loading, error, retry } = useAnimeSections();

  const openDetail = (item: MediaItem) => navigation.navigate('Detail', { item });
  const hero = sections.ongoing[0] ?? sections.popular[0];
  const isEmpty =
    !sections.ongoing.length &&
    !sections.popular.length &&
    !sections.topRated.length &&
    !sections.movies.length;

  if (!isTmdbConfigured) {
    return (
      <Screen scroll contentStyle={styles.content}>
        <AppHeader subtitle="Anime" />
        <TmdbSetup />
      </Screen>
    );
  }

  return (
    <Screen scroll contentStyle={styles.content}>
      <AppHeader subtitle="Anime" />

      {loading ? (
        <AnimeSkeleton />
      ) : error && isEmpty ? (
        <ErrorState
          title="Anime unavailable"
          message={error}
          onRetry={retry}
          retryLabel="Reload"
        />
      ) : isEmpty ? (
        <EmptyState
          title="No anime found"
          message="TMDB returned no Japanese animation right now. Try again shortly."
          icon={Compass}
        />
      ) : (
        <>
          {hero ? (
            <Billboard
              item={hero}
              kicker="Anime spotlight"
              liveLabel="Ongoing series"
              actionLabel="Watch this anime"
              onPlay={openDetail}
            />
          ) : null}

          <SectionHeader
            icon={Radio}
            tone={colors.live}
            kicker="This season"
            title="Ongoing anime"
            description="Series currently broadcasting new episodes."
            action={
              <View style={styles.seasonBadge}>
                <Text style={styles.seasonBadgeText}>THIS SEASON</Text>
              </View>
            }
          />
          <FadeInView delay={40}>
            <PosterGrid items={sections.ongoing.slice(0, 18)} onPress={openDetail} />
          </FadeInView>

          <View style={styles.rail}>
            <SectionHeader
              icon={Flame}
              kicker="Fan favourites"
              title="Most popular anime"
              description="Series with the biggest viewership and community following."
            />
            <FadeInView delay={120}>
              <PosterGrid items={sections.popular.slice(0, 18)} onPress={openDetail} />
            </FadeInView>
          </View>

          <View style={styles.rail}>
            <SectionHeader
              icon={Star}
              tone={colors.accent}
              kicker="Critically loved"
              title="Top rated anime"
              description="Highest-scoring animation, filtered for enough votes."
            />
            <FadeInView delay={200}>
              <PosterGrid items={sections.topRated.slice(0, 18)} onPress={openDetail} />
            </FadeInView>
          </View>

          <View style={styles.rail}>
            <SectionHeader
              icon={Film}
              tone={colors.textSecondary}
              kicker="Feature films"
              title="Anime movies"
              description="Theatrical animation from acclaimed studios and creators."
            />
            <FadeInView delay={280}>
              <PosterGrid items={sections.movies.slice(0, 18)} onPress={openDetail} />
            </FadeInView>
          </View>

          <View style={styles.footer}>
            <View style={styles.footerLine} />
            <Kicker>Japanese animation · TMDB</Kicker>
          </View>
        </>
      )}
    </Screen>
  );
};

const AnimeSkeleton = () => (
  <View>
    <Skeleton height={420} style={styles.heroSkeleton} />
    <View style={styles.skeletonHeading}>
      <Skeleton width={140} height={18} />
      <Skeleton width={230} height={11} style={styles.skeletonLine} />
    </View>
    <View style={styles.skeletonGrid}>
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} width={103} height={155} />
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  content: { paddingBottom: 130 },
  rail: { marginTop: spacing.xxxl },
  seasonBadge: {
    paddingHorizontal: 8,
    height: 24,
    justifyContent: 'center',
    borderRadius: 7,
    backgroundColor: colors.liveSoft,
    borderWidth: 1,
    borderColor: colors.liveBorder,
  },
  seasonBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 8.5,
    letterSpacing: 1,
    color: colors.live,
  },
  footer: { alignItems: 'center', gap: spacing.md, marginTop: spacing.xxl },
  footerLine: { width: 32, height: 1, backgroundColor: colors.border },
  heroSkeleton: { borderRadius: 0, marginBottom: spacing.xl },
  skeletonHeading: { paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  skeletonLine: { marginTop: spacing.sm },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
});
