import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Bookmark } from 'lucide-react-native';

import { useWatchlist } from '../hooks/useLibrary';
import { colors, fonts, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import type { MediaItem } from '../types';
import { PosterGrid } from '../components/PosterGrid';
import { EmptyState, Kicker, Screen } from '../components/ui/Primitives';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Saved titles, kept on-device and readable without a network round-trip. */
export const WatchlistScreen = () => {
  const navigation = useNavigation<Nav>();
  const { items, remove } = useWatchlist();

  const openDetail = (item: MediaItem) =>
    navigation.navigate('Detail', { item });

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={navigation.goBack}
          style={styles.circleButton}>
          <ArrowLeft color={colors.text} size={18} strokeWidth={2.2} />
        </Pressable>
        <View style={styles.headerText}>
          <Kicker>Your library</Kicker>
          <Text style={styles.title}>Watchlist</Text>
        </View>
        <Text style={styles.count}>
          {items.length} {items.length === 1 ? 'TITLE' : 'TITLES'}
        </Text>
      </View>

      {items.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          message="Tap the bookmark on any title to keep it here. Saved titles work offline."
          icon={Bookmark}
        />
      ) : (
        <>
          <Text style={styles.hint}>Long-press a poster to remove it.</Text>
          <PosterGrid
            items={items.map(entry => entry.item)}
            onPress={openDetail}
            onLongPress={remove}
          />
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: 80 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  headerText: { flex: 1 },
  title: {
    fontFamily: fonts.displayBlack,
    fontSize: 32,
    letterSpacing: -1,
    color: colors.text,
    marginTop: 2,
  },
  circleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glass,
  },
  count: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.4,
    color: colors.textFaint,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textFaint,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
});
