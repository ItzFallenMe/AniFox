import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search, X } from 'lucide-react-native';

import { isTmdbConfigured } from '../config/env';
import { useSearch } from '../hooks/useSearch';
import { colors, fonts, radius, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import type { MediaItem } from '../types';
import { AppHeader } from '../components/AppHeader';
import { PosterCard } from '../components/PosterCard';
import { TmdbSetup } from '../components/TmdbSetup';
import {
  Chip,
  EmptyState,
  ErrorState,
  Kicker,
  Screen,
  Skeleton,
} from '../components/ui/Primitives';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SUGGESTIONS = [
  'Jujutsu Kaisen',
  'Demon Slayer',
  'One Piece',
  'Attack on Titan',
  'Frieren',
  'Your Name',
];

export const SearchScreen = () => {
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const { results, loading, error, activeQuery, tooShort } = useSearch(query);

  const cardWidth = (width - spacing.xl * 2 - spacing.md * 2) / 3;
  const openDetail = (item: MediaItem) => navigation.navigate('Detail', { item });

  if (!isTmdbConfigured) {
    return (
      <Screen scroll contentStyle={styles.content}>
        <AppHeader subtitle="Discover" />
        <TmdbSetup />
      </Screen>
    );
  }

  const header = (
    <View>
      <AppHeader subtitle="Discover" />

      <View style={styles.pageHeader}>
        <Kicker>Find anything</Kicker>
        <Text style={styles.title}>Search</Text>
      </View>

      <View style={styles.searchBox}>
        <Search color={colors.textMuted} size={17} strokeWidth={2.2} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Anime, movies, series…"
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          selectionColor={colors.primary}
        />
        {query.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => setQuery('')}
            hitSlop={10}>
            <X color={colors.textMuted} size={16} strokeWidth={2.2} />
          </Pressable>
        ) : null}
      </View>

      {!activeQuery ? (
        <View style={styles.suggestions}>
          <Kicker style={styles.suggestionKicker}>Try searching</Kicker>
          <View style={styles.chipWrap}>
            {SUGGESTIONS.map(suggestion => (
              <Chip
                key={suggestion}
                label={suggestion}
                onPress={() => setQuery(suggestion)}
              />
            ))}
          </View>
        </View>
      ) : loading ? null : results.length > 0 ? (
        <View style={styles.resultsHeader}>
          <Kicker>{results.length} results</Kicker>
          <Text style={styles.resultsFor} numberOfLines={1}>
            “{activeQuery}”
          </Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <Screen contentStyle={styles.content}>
      <FlatList
        data={loading ? [] : results}
        keyExtractor={item => `${item.media_type}-${item.id}`}
        renderItem={({ item }) => (
          <PosterCard item={item} width={cardWidth} onPress={openDetail} compact />
        )}
        numColumns={3}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header}
        ListEmptyComponent={
          loading ? (
            <View style={styles.gridSkeleton}>
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} width={cardWidth} height={cardWidth * 1.48} />
              ))}
            </View>
          ) : error ? (
            <ErrorState message={error} />
          ) : tooShort ? (
            <EmptyState
              title="Keep typing"
              message="Type at least two characters to search the catalog."
              icon={Search}
            />
          ) : activeQuery ? (
            <EmptyState
              title="No matches"
              message={`Nothing found for “${activeQuery}”. Try a different title.`}
              icon={Search}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: 0 },
  list: { paddingBottom: 130 },
  pageHeader: { paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  title: {
    fontFamily: fonts.displayBlack,
    fontSize: 34,
    letterSpacing: -1.1,
    color: colors.text,
    marginTop: 2,
  },
  searchBox: {
    marginHorizontal: spacing.xl,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glass,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  input: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 13.5,
    color: colors.text,
    padding: 0,
  },
  suggestions: { marginTop: spacing.xxl, paddingHorizontal: spacing.xl },
  suggestionKicker: { marginBottom: spacing.md },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  resultsHeader: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    gap: 2,
  },
  resultsFor: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text,
  },
  column: { gap: spacing.md, paddingHorizontal: spacing.xl },
  gridSkeleton: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
});
