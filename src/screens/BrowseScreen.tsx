import type { ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Award,
  CalendarClock,
  ChevronRight,
  Clapperboard,
  Flame,
  PlayCircle,
  Radio,
  TrendingUp,
  Tv,
} from 'lucide-react-native';

import {
  MOVIE_CATALOGS,
  TV_CATALOGS,
  type CatalogDefinition,
  type CatalogKey,
} from '../config/catalogs';
import { colors, fonts, radius, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import { FadeInView } from '../components/animations';
import { AppHeader } from '../components/AppHeader';
import {
  GlassCard,
  Kicker,
  Screen,
  SectionHeader,
} from '../components/ui/Primitives';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type IconType = ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

const ICONS: Record<CatalogKey, IconType> = {
  popularMovies: Flame,
  nowPlaying: PlayCircle,
  upcoming: CalendarClock,
  topRatedMovies: Award,
  trendingMovies: TrendingUp,
  popularTv: Tv,
  airingToday: Radio,
  onTheAir: Radio,
  topRatedTv: Award,
  trendingTv: TrendingUp,
};

export const BrowseScreen = () => {
  const navigation = useNavigation<Nav>();

  return (
    <Screen scroll contentStyle={styles.content}>
      <AppHeader subtitle="Browse" />

      <View style={styles.pageHeader}>
        <Kicker>Every catalog</Kicker>
        <Text style={styles.title}>Browse</Text>
        <Text style={styles.description}>
          Movies and series by mood, moment and momentum.
        </Text>
      </View>

      <FadeInView delay={40}>
        <SectionHeader
          icon={Clapperboard}
          kicker="At the cinema"
          title="Movies"
          description="Five ways into the film catalog."
        />
        <View style={styles.section}>
          <GlassCard style={styles.listCard}>
            {MOVIE_CATALOGS.map((catalog, index) => (
              <CatalogRow
                key={catalog.key}
                catalog={catalog}
                last={index === MOVIE_CATALOGS.length - 1}
                onPress={() => navigation.navigate('Catalog', { key: catalog.key })}
              />
            ))}
          </GlassCard>
        </View>
      </FadeInView>

      <FadeInView delay={140}>
        <SectionHeader
          icon={Tv}
          kicker="On the small screen"
          title="Series"
          description="Five ways into the television catalog."
        />
        <View style={styles.section}>
          <GlassCard style={styles.listCard}>
            {TV_CATALOGS.map((catalog, index) => (
              <CatalogRow
                key={catalog.key}
                catalog={catalog}
                last={index === TV_CATALOGS.length - 1}
                onPress={() => navigation.navigate('Catalog', { key: catalog.key })}
              />
            ))}
          </GlassCard>
        </View>
      </FadeInView>
    </Screen>
  );
};

const CatalogRow = ({
  catalog,
  last,
  onPress,
}: {
  catalog: CatalogDefinition;
  last: boolean;
  onPress: () => void;
}) => {
  const Icon = ICONS[catalog.key] ?? Clapperboard;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Browse ${catalog.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && styles.rowDivider,
        pressed && styles.pressed,
      ]}>
      <View style={styles.rowIcon}>
        <Icon color={colors.primary} size={15} strokeWidth={2} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{catalog.title}</Text>
        <Text numberOfLines={1} style={styles.rowKicker}>
          {catalog.kicker}
        </Text>
      </View>
      <ChevronRight color={colors.textMuted} size={16} strokeWidth={2} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: 140 },
  pageHeader: { paddingHorizontal: spacing.xl, marginBottom: spacing.xxl },
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
    maxWidth: 330,
  },
  section: { paddingHorizontal: spacing.xl, marginBottom: spacing.xxxl },
  listCard: { padding: 0, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13.5,
    color: colors.text,
  },
  rowKicker: {
    fontFamily: fonts.body,
    fontSize: 10.5,
    color: colors.textFaint,
    marginTop: 1,
  },
  pressed: { opacity: 0.7 },
});
