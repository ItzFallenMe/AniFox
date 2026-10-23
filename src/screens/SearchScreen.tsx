import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search, X } from 'lucide-react-native';

import { isTmdbConfigured } from '../config/env';
import { useSearch } from '../hooks/useSearch';
import { colors, fonts, radius, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import type { MediaItem } from '../types';
import { AppHeader } from '../components/AppHeader';
import { Pagination } from '../components/Pagination';
import { PosterGrid } from '../components/PosterGrid';
import { TmdbSetup } from '../components/TmdbSetup';
import {
  Chip,
  EmptyState,
  ErrorState,
  Kicker,
  Screen,
  SectionHeader,
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
  const [query, setQuery] = useState('');
  const {
    results,
    page,
    totalPages,
    loading,
    error,
    activeQuery,
    tooShort,
    goTo,
    retry,
  } = useSearch(query);

  const openDetail = (item: MediaItem) => navigation.navigate('Detail', { item });

  if (!isTmdbConfigured) {
    return (
      <Screen scroll contentStyle={styles.content}>
        <AppHeader subtitle="Discover" />
        <TmdbSetup />
      </Screen>
    );
  }

  return (
    <Screen scroll contentStyle={styles.content}>
      <AppHeader subtitle="Discover" />

      <View style={styles.pageHeader}>
        <Kicker>Find anything</Kicker>
        <Text style={styles.title}>Search</Text>
        <Text style={styles.description}>
          Movies, series and anime from the whole TMDB catalog.
        </Text>
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
      ) : (
        <>
          <SectionHeader
            kicker={`Deep search${totalPages > 1 ? ` · page ${page} of ${totalPages}` : ''}`}
            title={`Results for “${activeQuery}”`}
            description={
              loading
                ? 'Searching the catalog…'
                : results.length > 0
                  ? `${results.length} title${results.length === 1 ? '' : 's'} on this page`
                  : 'No titles found'
            }
          />

          {loading ? (
            <PosterGrid items={[]} onPress={openDetail} loading />
          ) : error ? (
            <ErrorState message={error} onRetry={retry} />
          ) : results.length === 0 ? (
            tooShort ? (
              <EmptyState
                title="Keep typing"
                message="Type at least two characters to search the catalog."
                icon={Search}
              />
            ) : (
              <EmptyState
                title="No matches"
                message={`Nothing catalog-ready found for “${activeQuery}”. Try a different title.`}
                icon={Search}
              />
            )
          ) : (
            <PosterGrid items={results} onPress={openDetail} />
          )}

          {!loading && !error && results.length > 0 ? (
            <Pagination page={page} totalPages={totalPages} onChange={goTo} />
          ) : null}
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: 130 },
  pageHeader: { paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
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
  },
  searchBox: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    height: 50,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
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
  suggestions: { paddingHorizontal: spacing.xl },
  suggestionKicker: { marginBottom: spacing.md },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
