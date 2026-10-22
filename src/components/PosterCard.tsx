import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Film, Star } from 'lucide-react-native';

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
}

export const PosterCard = ({
  item,
  width = 118,
  onPress,
  compact = false,
}: PosterCardProps) => {
  const [failed, setFailed] = useState(false);
  const uri = TMDBService.posterUrl(item.poster_path, 'w500');
  const year = getYear(item);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={getTitle(item)}
      onPress={() => onPress(item)}
      style={({ pressed }) => [{ width }, pressed && styles.pressed]}>
      <View style={[styles.frame, { height: width * 1.48 }]}>
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

        <View style={styles.rating}>
          <Star color={colors.text} size={9} strokeWidth={2.6} fill={colors.text} />
          <Text style={styles.ratingText}>{formatRating(item.vote_average)}</Text>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.media_type === 'tv' ? 'TV' : 'FILM'}</Text>
        </View>
      </View>

      <Text numberOfLines={1} style={[styles.title, compact && styles.titleCompact]}>
        {getTitle(item)}
      </Text>
      {!compact ? <Text style={styles.year}>{year || '—'}</Text> : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
  frame: {
    borderRadius: radius.md,
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
  rating: {
    position: 'absolute',
    top: 7,
    right: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    height: 19,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratingText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: colors.text,
  },
  badge: {
    position: 'absolute',
    top: 7,
    left: 7,
    height: 17,
    paddingHorizontal: 5,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 7,
    letterSpacing: 1,
    color: colors.textSecondary,
  },
  title: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text,
    marginTop: spacing.sm,
  },
  titleCompact: { fontSize: 11 },
  year: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textFaint,
    marginTop: 2,
  },
});
