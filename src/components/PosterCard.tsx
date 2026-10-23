import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Film, Play } from 'lucide-react-native';

import { PressableScale } from './animations';

import { colors, fonts, radius, spacing } from '../theme';
import { TMDBService } from '../services/tmdb';
import { getTitle, getYear, type MediaItem } from '../types';
import { formatRating } from '../utils/format';

interface PosterCardProps {
  item: MediaItem;
  width?: number;
  onPress: (item: MediaItem) => void;
  /** Tighter typography for grid layouts. */
  compact?: boolean;
  /** 1-based position, drawn as a rank numeral (Top 10 rows). */
  rank?: number;
}

/** Poster aspect ratio, matching sarui-movies' `aspect-[2/3]` cards. */
export const POSTER_RATIO = 1.5;

export const PosterCard = ({
  item,
  width = 118,
  onPress,
  compact = false,
  rank,
}: PosterCardProps) => {
  const [failed, setFailed] = useState(false);
  const [pressed, setPressed] = useState(false);
  const uri = TMDBService.posterUrl(item.poster_path, 'w500');
  const year = getYear(item);
  const hasRating = Boolean(item.vote_average && item.vote_average > 0);
  const isShow = item.media_type === 'tv';

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={getTitle(item)}
      onPress={() => onPress(item)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[styles.card, { width }]}>
      <View style={[styles.frame, { height: width * POSTER_RATIO }]}>
        {uri && !failed ? (
          <Image
            source={{ uri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <View style={styles.placeholder}>
            <Film color={colors.textFaint} size={24} strokeWidth={1.4} />
          </View>
        )}

        <View style={styles.pills} pointerEvents="none">
          {hasRating ? (
            <View style={styles.ratingPill}>
              <Text style={styles.ratingStar}>★</Text>
              <Text style={styles.ratingText}>{formatRating(item.vote_average)}</Text>
            </View>
          ) : null}
          {year ? (
            <View style={[styles.yearPill, !hasRating && styles.yearPillLeft]}>
              <Text style={styles.yearText}>{year}</Text>
            </View>
          ) : null}
        </View>

        {pressed ? (
          <LinearGradient
            colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.82)']}
            locations={[0, 0.45, 1]}
            style={[StyleSheet.absoluteFill, styles.pressOverlay]}
            pointerEvents="none">
            <View style={styles.playCircle}>
              <Play
                color={colors.onPrimary}
                size={16}
                strokeWidth={0}
                fill={colors.onPrimary}
              />
            </View>
          </LinearGradient>
        ) : null}

        {rank != null ? (
          <View style={styles.rank}>
            <Text style={styles.rankText}>{rank}</Text>
          </View>
        ) : null}
      </View>

      <Text numberOfLines={1} style={[styles.title, compact && styles.titleCompact]}>
        {getTitle(item)}
      </Text>

      {!compact ? (
        <View style={styles.metaRow}>
          <Text style={styles.year}>{year || (isShow ? 'Series' : 'Film')}</Text>
          <View style={styles.typeChip}>
            <Text style={styles.typeText}>{isShow ? 'SERIES' : 'MOVIE'}</Text>
          </View>
        </View>
      ) : null}
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  card: { paddingBottom: 2 },
  frame: {
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
  pills: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    height: 19,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.68)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratingStar: { fontSize: 8, color: colors.accent },
  ratingText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9.5,
    color: colors.accent,
  },
  yearPill: {
    paddingHorizontal: 6,
    height: 19,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  yearPillLeft: { marginLeft: 0 },
  yearText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 9.5,
    color: colors.textSecondary,
  },
  pressOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  rank: {
    position: 'absolute',
    left: 6,
    bottom: 5,
    minWidth: 30,
    height: 30,
    paddingHorizontal: 4,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.78)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  rankText: {
    fontFamily: fonts.displayBlack,
    fontSize: 15,
    color: colors.text,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12.5,
    lineHeight: 16,
    color: colors.text,
    marginTop: spacing.sm,
  },
  titleCompact: { fontSize: 12 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginTop: 3,
  },
  year: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.textMuted,
  },
  typeChip: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  typeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 7,
    letterSpacing: 0.8,
    color: colors.textMuted,
  },
});
