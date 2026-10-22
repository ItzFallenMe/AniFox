import { useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Info, Play, Star } from 'lucide-react-native';

import { colors, fonts, radius, spacing } from '../theme';
import { TMDBService } from '../services/tmdb';
import { getTitle, getYear, type MediaItem } from '../types';
import { formatRating } from '../utils/format';
import { GhostButton, PrimaryButton, PulsingDot } from './ui/Primitives';

const HERO_HEIGHT = 486;

interface HeroCarouselProps {
  items: MediaItem[];
  onPlay: (item: MediaItem) => void;
  onInfo: (item: MediaItem) => void;
}

export const HeroCarousel = ({ items, onPlay, onInfo }: HeroCarouselProps) => {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  if (items.length === 0) return null;

  const onMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        decelerationRate="fast">
        {items.map((item, position) => {
          const backdrop = TMDBService.backdropUrl(item.backdrop_path, 'w780');
          return (
            <View key={`${item.media_type}-${item.id}`} style={[styles.slide, { width }]}>
              {backdrop ? (
                <Image source={{ uri: backdrop }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <View style={[StyleSheet.absoluteFill, styles.fallbackBackdrop]} />
              )}

              <LinearGradient
                colors={[
                  'rgba(0,0,0,0.62)',
                  'rgba(0,0,0,0.18)',
                  'rgba(0,0,0,0.88)',
                  colors.background,
                ]}
                locations={[0, 0.34, 0.76, 1]}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.content}>
                <View style={styles.kickerRow}>
                  <PulsingDot />
                  <Text style={styles.kicker}>
                    Trending anime · #{position + 1}
                  </Text>
                </View>

                <Text numberOfLines={2} style={styles.title}>
                  {getTitle(item)}
                </Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaChip}>
                    <Star color={colors.primary} size={10} strokeWidth={2.4} fill={colors.primary} />
                    <Text style={styles.metaStrong}>{formatRating(item.vote_average)}</Text>
                  </View>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.meta}>{getYear(item) || 'New'}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.meta}>
                    {item.media_type === 'tv' ? 'Series' : 'Movie'}
                  </Text>
                </View>

                <Text numberOfLines={3} style={styles.overview}>
                  {item.overview || 'A story worth staying up for.'}
                </Text>

                <View style={styles.actions}>
                  <PrimaryButton
                    label="Watch now"
                    icon={Play}
                    onPress={() => onPlay(item)}
                    style={styles.playButton}
                  />
                  <GhostButton label="Details" icon={Info} onPress={() => onInfo(item)} />
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {items.length > 1 ? (
        <View style={styles.dots}>
          {items.map((item, position) => (
            <View
              key={`dot-${item.id}`}
              style={[styles.dot, position === index && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { height: HERO_HEIGHT, marginBottom: spacing.lg },
  slide: { height: HERO_HEIGHT, justifyContent: 'flex-end' },
  fallbackBackdrop: { backgroundColor: '#0d0d0d' },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 38,
    gap: spacing.sm,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  kicker: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  title: {
    fontFamily: fonts.displayBlack,
    fontSize: 38,
    lineHeight: 41,
    letterSpacing: -1.1,
    color: colors.text,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 2,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  metaStrong: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.text,
  },
  meta: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  metaDot: { color: colors.textFaint, fontSize: 10 },
  overview: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.textSecondary,
    maxWidth: 520,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  playButton: { paddingHorizontal: spacing.xxl },
  dots: {
    position: 'absolute',
    right: spacing.xl,
    bottom: 16,
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.primary,
  },
});
