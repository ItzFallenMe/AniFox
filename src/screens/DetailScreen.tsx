import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Bell,
  BellRing,
  Bookmark,
  BookmarkCheck,
  Clock,
  Film,
  Play,
  Star,
} from 'lucide-react-native';

import { getOverviewText } from '../services/tmdbPolicy';
import { PosterGrid } from '../components/PosterGrid';
import { TrailerModal } from '../components/TrailerModal';
import LinearGradient from 'react-native-linear-gradient';

import { APP_INFO } from '../config/env';
import { useDetails, useSeasonEpisodes } from '../hooks/useDetails';
import { TMDBService } from '../services/tmdb';
import { colors, fonts, radius, spacing } from '../theme';
import {
  getTitle,
  getYear,
  isMovie,
  type CastMember,
  type Episode,
  type MediaItem,
  type Season,
  type TVShowDetails,
} from '../types';
import { formatAirDate, formatRating, formatRuntime } from '../utils/format';
import { useEpisodeAlerts, useWatchHistory, useWatchlist } from '../hooks/useLibrary';
import {
  disableEpisodeAlert,
  enableEpisodeAlert,
} from '../services/episodeAlerts';
import type { RootStackParamList } from '../navigation/types';
import {
  Chip,
  ErrorState,
  GhostButton,
  GlassCard,
  IconButton,
  Kicker,
  PrimaryButton,
  Screen,
  SectionHeader,
  Skeleton,
} from '../components/ui/Primitives';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = { params: { item: MediaItem } };

export const DetailScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute() as Route;
  const { item } = route.params;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const movie = isMovie(item);

  const { details, cast, similar, trailerKey, loading, error, retry } =
    useDetails(item);
  const [selectedSeason, setSelectedSeason] = useState<number | undefined>();
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [alertBusy, setAlertBusy] = useState(false);
  const [alertNote, setAlertNote] = useState<string | null>(null);

  const { saved, toggle: toggleSaved } = useWatchlist();
  const { resumeFor } = useWatchHistory();
  const { alertFor } = useEpisodeAlerts();
  const isSaved = saved(item);
  const resume = resumeFor(item);
  const alert = alertFor(item.id);
  const nextEpisode = movie
    ? null
    : (details as TVShowDetails | null)?.next_episode_to_air ?? null;

  const seasons: Season[] = useMemo(
    () => (!movie && details ? ((details as TVShowDetails).seasons ?? []) : []),
    [details, movie],
  );
  const playableSeasons = seasons.filter(season => season.season_number > 0);

  useEffect(() => {
    if (movie || !seasons.length) return;
    if (selectedSeason != null) return;
    const first = seasons.find(season => season.season_number > 0) ?? seasons[0];
    if (first) setSelectedSeason(first.season_number);
  }, [movie, seasons, selectedSeason]);

  const { episodes, loading: episodesLoading } = useSeasonEpisodes(
    item.id,
    movie ? undefined : selectedSeason,
  );

  const backdrop = TMDBService.backdropUrl(details?.backdrop_path ?? item.backdrop_path, 'w780');
  const genres = details?.genres ?? [];
  const year = getYear(item);
  const runtime = movie ? (details as { runtime?: number } | null)?.runtime : undefined;
  const seasonCount = (details as TVShowDetails | null)?.number_of_seasons;

  const openPlayer = (episode?: Episode) =>
    navigation.navigate('Player', {
      item,
      season: movie ? undefined : episode?.season_number ?? selectedSeason ?? 1,
      episode: movie ? undefined : episode?.episode_number ?? 1,
      episodeName: episode?.name,
    });

  /** Resume from history when possible, otherwise play the first episode. */
  const playPrimary = () => {
    if (!movie && resume?.season != null && resume.episode != null) {
      navigation.navigate('Player', {
        item,
        season: resume.season,
        episode: resume.episode,
        episodeName: resume.episodeName,
      });
      return;
    }
    openPlayer(movie ? undefined : episodes[0]);
  };

  const toggleAlert = async () => {
    if (!nextEpisode || alertBusy) return;
    setAlertBusy(true);
    if (alert) {
      await disableEpisodeAlert(item.id);
      setAlertNote('Episode alert removed.');
    } else {
      const result = await enableEpisodeAlert(item, nextEpisode);
      setAlertNote(
        result === 'scheduled'
          ? `Alert set for ${formatAirDate(nextEpisode.air_date ?? undefined)}, 19:00.`
          : result === 'denied'
            ? 'Notifications are blocked. Allow them in system settings.'
            : 'Notifications are unavailable in this build.',
      );
    }
    setAlertBusy(false);
  };

  const openDetail = (next: MediaItem) =>
    navigation.replace('Detail', { item: next });

  if (loading) {
    return <DetailSkeleton onBack={navigation.goBack} topInset={insets.top} />;
  }

  if (error || !details) {
    return (
      <Screen edges={[]} style={styles.errorScreen}>
        <View style={[styles.absoluteBack, { top: insets.top + 8 }]}>
          <IconButton icon={ArrowLeft} onPress={navigation.goBack} accessibilityLabel="Back" />
        </View>
        <ErrorState message={error ?? 'This title is unavailable.'} onRetry={retry} />
      </Screen>
    );
  }

  const metaLine = [
    year,
    movie ? 'Movie' : 'Series',
    runtime ? formatRuntime(runtime) : seasonCount ? `${seasonCount} seasons` : '',
  ].filter(Boolean);

  return (
    <Screen edges={[]}>
      <View style={[styles.absoluteBack, { top: insets.top + 8 }]}>
        <IconButton icon={ArrowLeft} onPress={navigation.goBack} accessibilityLabel="Back" />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.backdrop, { width, height: width * 0.72 }]}>
          {backdrop ? (
            <Image source={{ uri: backdrop }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.backdropFallback]} />
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.15)', colors.background]}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        <GlassCard style={styles.titleCard}>
          <Kicker>{movie ? 'Feature film' : 'Series'}</Kicker>
          <Text style={styles.title}>{getTitle(item)}</Text>

          <View style={styles.metaRow}>
            <View style={styles.ratingChip}>
              <Star color={colors.accent} size={10} strokeWidth={2.6} fill={colors.accent} />
              <Text style={styles.ratingText}>{formatRating(details.vote_average)}</Text>
            </View>
            {metaLine.map(piece => (
              <View key={piece} style={styles.metaItem}>
                <Text style={styles.metaText}>{piece}</Text>
                <View style={styles.metaSeparator} />
              </View>
            ))}
          </View>

          {details.tagline ? (
            <Text style={styles.tagline}>“{details.tagline}”</Text>
          ) : null}

          {genres.length > 0 ? (
            <View style={styles.genreRow}>
              {genres.slice(0, 4).map(genre => (
                <View key={genre.id} style={styles.genreChip}>
                  <Text style={styles.genreText}>{genre.name}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.actionRow}>
            <PrimaryButton
              label={
                !movie && resume?.season != null && resume.episode != null
                  ? `Continue S${resume.season} · E${resume.episode}`
                  : movie
                    ? 'Watch now'
                    : 'Watch episode'
              }
              icon={Play}
              onPress={playPrimary}
              style={styles.playButton}
            />
            <IconButton
              icon={isSaved ? BookmarkCheck : Bookmark}
              color={isSaved ? colors.orange : colors.text}
              onPress={() => toggleSaved(item)}
              accessibilityLabel={
                isSaved ? 'Remove from watchlist' : 'Add to watchlist'
              }
              style={styles.saveButton}
            />
          </View>

          {trailerKey || nextEpisode ? (
            <View style={styles.secondaryRow}>
              {trailerKey ? (
                <GhostButton
                  label="Trailer"
                  icon={Film}
                  onPress={() => setTrailerOpen(true)}
                  style={styles.secondaryButton}
                />
              ) : null}
              {nextEpisode ? (
                <GhostButton
                  label={alert ? 'Alert on' : 'Alert me'}
                  icon={alert ? BellRing : Bell}
                  onPress={toggleAlert}
                  style={styles.secondaryButton}
                />
              ) : null}
            </View>
          ) : null}

          {nextEpisode ? (
            <View style={styles.nextRow}>
              <Bell color={colors.orange} size={11} strokeWidth={2.2} />
              <Text style={styles.nextText} numberOfLines={1}>
                Next · S{nextEpisode.season_number ?? '?'} E
                {nextEpisode.episode_number ?? '?'} ·{' '}
                {formatAirDate(nextEpisode.air_date ?? undefined)}
              </Text>
            </View>
          ) : null}

          {alertNote ? <Text style={styles.alertNote}>{alertNote}</Text> : null}

          <View style={styles.hintRow}>
            <Film color={colors.textFaint} size={12} strokeWidth={2} />
            <Text style={styles.hint}>
              Streams from eight embed providers — switch servers in the player.
            </Text>
          </View>
        </GlassCard>

        <View style={styles.section}>
          <Kicker style={styles.sectionKicker}>Storyline</Kicker>
          <Text style={styles.overview}>{getOverviewText(details.overview)}</Text>
        </View>

        {!movie && playableSeasons.length > 0 ? (
          <View style={styles.sectionNoPad}>
            <SectionHeader kicker="Episodes" title={`Season ${selectedSeason ?? 1}`} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.seasonChips}>
              {playableSeasons.map(season => (
                <Chip
                  key={season.season_number}
                  label={season.name.replace(/^Season\s*/i, 'S')}
                  active={selectedSeason === season.season_number}
                  onPress={() => setSelectedSeason(season.season_number)}
                />
              ))}
            </ScrollView>

            <View style={styles.episodeList}>
              {episodesLoading
                ? [0, 1, 2].map(index => (
                    <Skeleton key={index} height={64} style={styles.episodeSkeleton} />
                  ))
                : episodes.map(episode => (
                    <EpisodeRow
                      key={episode.id}
                      episode={episode}
                      onPress={() => openPlayer(episode)}
                    />
                  ))}
              {!episodesLoading && episodes.length === 0 ? (
                <Text style={styles.emptyEpisodes}>No episodes listed for this season.</Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {cast.length > 0 ? (
          <View style={styles.sectionNoPad}>
            <SectionHeader kicker="Starring" title="Cast" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.castList}>
              {cast.map(member => (
                <CastCard key={member.id} member={member} />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {similar.length > 0 ? (
          <View style={styles.similar}>
            <SectionHeader
              kicker="Because you watched"
              title="More like this"
              description="Same mood, same catalogue policy."
            />
            <PosterGrid items={similar.slice(0, 9)} onPress={openDetail} />
          </View>
        ) : null}

        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Kicker>{APP_INFO.name} · curated by {APP_INFO.creator}</Kicker>
        </View>
      </ScrollView>

      <TrailerModal
        videoKey={trailerOpen ? trailerKey : null}
        title={getTitle(item)}
        onClose={() => setTrailerOpen(false)}
      />
    </Screen>
  );
};

const EpisodeRow = ({ episode, onPress }: { episode: Episode; onPress: () => void }) => {
  const still = TMDBService.imageUrl(episode.still_path, 'w185');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Episode ${episode.episode_number}, ${episode.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.episodeRow, pressed && styles.pressed]}>
      <View style={styles.episodeThumb}>
        {still ? (
          <Image source={{ uri: still }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <Film color={colors.textFaint} size={16} strokeWidth={1.6} />
        )}
      </View>

      <View style={styles.episodeInfo}>
        <Text style={styles.episodeKicker}>
          EPISODE {String(episode.episode_number).padStart(2, '0')}
        </Text>
        <Text numberOfLines={1} style={styles.episodeName}>
          {episode.name}
        </Text>
        {episode.overview ? (
          <Text numberOfLines={2} style={styles.episodeOverview}>
            {episode.overview}
          </Text>
        ) : null}
        <View style={styles.episodeMeta}>
          {episode.runtime ? (
            <>
              <Clock color={colors.textFaint} size={10} strokeWidth={2} />
              <Text style={styles.episodeMetaText}>{formatRuntime(episode.runtime)}</Text>
            </>
          ) : (
            <Text style={styles.episodeMetaText}>
              {episode.air_date ? episode.air_date.slice(0, 4) : 'Episode'}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.episodePlay}>
        <Play color={colors.primary} size={13} strokeWidth={2.4} fill={colors.primary} />
      </View>
    </Pressable>
  );
};

const CastCard = ({ member }: { member: CastMember }) => {
  const [failed, setFailed] = useState(false);
  const uri = TMDBService.profileUrl(member.profile_path);
  const initials = member.name
    .split(' ')
    .slice(0, 2)
    .map(part => part[0])
    .join('');

  return (
    <View style={styles.castCard}>
      <View style={styles.castAvatar}>
        {uri && !failed ? (
          <Image source={{ uri }} style={styles.castImage} onError={() => setFailed(true)} />
        ) : (
          <Text style={styles.castInitials}>{initials}</Text>
        )}
      </View>
      <Text numberOfLines={2} style={styles.castName}>
        {member.name}
      </Text>
      {member.character ? (
        <Text numberOfLines={1} style={styles.castRole}>
          {member.character}
        </Text>
      ) : null}
    </View>
  );
};

const DetailSkeleton = ({
  onBack,
  topInset,
}: {
  onBack: () => void;
  topInset: number;
}) => (
  <Screen edges={[]}>
    <View style={[styles.absoluteBack, { top: topInset + 8 }]}>
      <IconButton icon={ArrowLeft} onPress={onBack} accessibilityLabel="Back" />
    </View>
    <Skeleton height={280} style={styles.skeletonBackdrop} />
    <View style={styles.skeletonBody}>
      <Skeleton width={70} height={10} />
      <Skeleton height={30} style={styles.skeletonTitle} />
      <Skeleton width={160} height={12} />
      <Skeleton height={92} style={styles.skeletonCard} />
      <Skeleton width={110} height={14} style={styles.skeletonCard} />
      <Skeleton height={14} />
      <Skeleton height={14} style={styles.skeletonLine} />
    </View>
  </Screen>
);

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxxl },
  errorScreen: { alignItems: 'stretch', justifyContent: 'center' },
  absoluteBack: { position: 'absolute', left: spacing.xl, zIndex: 10 },
  backdrop: { backgroundColor: colors.surface },
  backdropFallback: { backgroundColor: colors.surfaceRaised },
  titleCard: {
    marginTop: -28,
    marginHorizontal: spacing.xl,
    padding: spacing.xxl,
  },
  title: {
    fontFamily: fonts.displayBlack,
    fontSize: 30,
    lineHeight: 33,
    letterSpacing: -1,
    color: colors.text,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 7,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratingText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.accent,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  metaSeparator: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.textFaint,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    fontStyle: 'italic',
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  genreChip: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glass,
    justifyContent: 'center',
  },
  genreText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  playButton: { flex: 1 },
  saveButton: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.glass,
    borderColor: colors.border,
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  secondaryButton: { flex: 1 },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.md,
  },
  nextText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 10.5,
    color: colors.textMuted,
  },
  alertNote: {
    fontFamily: fonts.body,
    fontSize: 10.5,
    lineHeight: 16,
    color: colors.orange,
    marginTop: spacing.sm,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textFaint,
  },

  section: { paddingHorizontal: spacing.xl + 4, marginTop: spacing.xxl },
  sectionNoPad: { marginTop: spacing.xxxl },
  sectionKicker: { marginBottom: spacing.sm },
  overview: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  seasonChips: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  episodeList: { paddingHorizontal: spacing.xl, gap: spacing.sm },
  episodeSkeleton: { borderRadius: radius.md },
  episodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  episodeThumb: {
    width: 74,
    height: 42,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  episodeInfo: { flex: 1 },
  episodeKicker: {
    fontFamily: fonts.bodyBold,
    fontSize: 8.5,
    letterSpacing: 1.1,
    color: colors.primary,
    marginBottom: 1,
  },
  episodeName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12.5,
    color: colors.text,
  },
  episodeOverview: {
    fontFamily: fonts.body,
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.textMuted,
    marginTop: 2,
  },
  episodeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  episodeMetaText: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textFaint,
  },
  episodePlay: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEpisodes: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    paddingVertical: spacing.lg,
  },
  pressed: { opacity: 0.7 },

  castList: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  castCard: { width: 74, alignItems: 'center' },
  castAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  castImage: { width: '100%', height: '100%' },
  castInitials: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.textMuted,
  },
  castName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    lineHeight: 13,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  castRole: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: 1,
  },

  similar: { marginTop: spacing.xxl },
  footer: { alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  footerLine: { width: 32, height: 1, backgroundColor: colors.border },

  skeletonBackdrop: { borderRadius: 0 },
  skeletonBody: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, gap: spacing.md },
  skeletonTitle: { width: '72%' },
  skeletonCard: { marginTop: spacing.lg, borderRadius: radius.lg },
  skeletonLine: { width: '80%' },
});
