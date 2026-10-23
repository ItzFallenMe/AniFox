import type { ComponentType } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Info, Play, Sparkles } from 'lucide-react-native';

import { TMDBService } from '../services/tmdb';
import { getTitle, getYear, type MediaItem } from '../types';
import { getOverviewText } from '../services/tmdbPolicy';
import { formatRating } from '../utils/format';
import { colors, fonts, spacing } from '../theme';
import { GhostButton, PrimaryButton } from './ui/Primitives';

type IconType = ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

interface BillboardProps {
  item: MediaItem;
  /** Rose spotlight pill label, e.g. "Today's spotlight". */
  kicker: string;
  kickerIcon?: IconType;
  /** Emerald live pill, e.g. "Ongoing series". */
  liveLabel?: string;
  /** Primary CTA label. */
  actionLabel?: string;
  onPlay: (item: MediaItem) => void;
  /** Second CTA; omitted when the primary action already opens details. */
  onInfo?: (item: MediaItem) => void;
}

/**
 * Full-bleed cinematic billboard: backdrop, dual vignette, the rose spotlight
 * pill, amber score, synopsis and the two CTAs — sarui-movies' spotlight hero.
 */
export const Billboard = ({
  item,
  kicker,
  kickerIcon: KickerIcon = Sparkles,
  liveLabel,
  actionLabel = 'Watch now',
  onPlay,
  onInfo,
}: BillboardProps) => {
  const { width } = useWindowDimensions();
  const height = Math.min(Math.round(width * 1.1), 470);
  const backdrop = TMDBService.backdropUrl(item.backdrop_path, 'original');
  const rating = formatRating(item.vote_average);

  return (
    <View style={[styles.container, { height }]}>
      {backdrop ? (
        <Image
          source={{ uri: backdrop }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.fallback]} />
      )}

      <LinearGradient
        colors={[
          'rgba(9,9,11,0.15)',
          'rgba(9,9,11,0.55)',
          'rgba(9,9,11,0.92)',
          colors.background,
        ]}
        locations={[0, 0.42, 0.82, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(9,9,11,0.92)', 'rgba(9,9,11,0.25)', 'rgba(9,9,11,0)']}
        locations={[0, 0.6, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View style={styles.badges}>
          <View style={styles.spotlight}>
            <KickerIcon color={colors.primary} size={11} strokeWidth={2.2} />
            <Text style={styles.spotlightText}>{kicker}</Text>
          </View>

          {liveLabel ? (
            <View style={styles.live}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>{liveLabel}</Text>
            </View>
          ) : null}

          {rating !== 'NR' ? (
            <View style={styles.rating}>
              <Text style={styles.ratingStar}>★</Text>
              <Text style={styles.ratingText}>{rating}</Text>
            </View>
          ) : null}

          {getYear(item) ? (
            <View style={styles.year}>
              <Text style={styles.yearText}>{getYear(item)}</Text>
            </View>
          ) : null}
        </View>

        <Text numberOfLines={2} style={styles.title}>
          {getTitle(item)}
        </Text>

        <Text numberOfLines={3} style={styles.overview}>
          {getOverviewText(item.overview)}
        </Text>

        <View style={styles.actions}>
          <PrimaryButton
            label={actionLabel}
            icon={Play}
            onPress={() => onPlay(item)}
          />
          {onInfo ? (
            <GhostButton label="Details" icon={Info} onPress={() => onInfo(item)} />
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { justifyContent: 'flex-end', marginBottom: spacing.xl },
  fallback: { backgroundColor: colors.surfaceRaised },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  spotlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 7,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  spotlightText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.primary,
  },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 7,
    backgroundColor: colors.liveSoft,
    borderWidth: 1,
    borderColor: colors.liveBorder,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.live,
  },
  liveText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 9.5,
    color: colors.live,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 7,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratingStar: { fontSize: 9, color: colors.accent },
  ratingText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 9.5,
    color: colors.accent,
  },
  year: {
    height: 24,
    paddingHorizontal: 8,
    justifyContent: 'center',
    borderRadius: 7,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  yearText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 9.5,
    color: colors.textSecondary,
  },
  title: {
    fontFamily: fonts.displayBlack,
    fontSize: 34,
    lineHeight: 37,
    letterSpacing: -1,
    color: colors.text,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
    marginTop: 2,
  },
  overview: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.textSecondary,
    maxWidth: 520,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
