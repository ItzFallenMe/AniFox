import { useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Compass } from 'lucide-react-native';

import { catalogByKey, type CatalogKey } from '../config/catalogs';
import { usePagedCatalog } from '../hooks/usePagedCatalog';
import { colors, fonts, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import type { MediaItem } from '../types';
import { Pagination } from '../components/Pagination';
import { PosterGrid } from '../components/PosterGrid';
import {
  EmptyState,
  ErrorState,
  IconButton,
  Kicker,
  Screen,
} from '../components/ui/Primitives';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = { params: { key: CatalogKey } };

export const CatalogScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute() as Route;
  const catalog = catalogByKey(route.params.key);
  const { items, page, totalPages, loading, error, goTo, retry } =
    usePagedCatalog(catalog.key);

  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    if (!loading) setRefreshing(false);
  }, [loading]);

  const openDetail = (item: MediaItem) => navigation.navigate('Detail', { item });

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            retry();
          }}
          tintColor={colors.primary}
          colors={[colors.primary]}
          progressBackgroundColor={colors.surface}
        />
      }
      contentStyle={styles.content}>
      <View style={styles.topBar}>
        <IconButton
          icon={ArrowLeft}
          accessibilityLabel="Back"
          onPress={navigation.goBack}
        />
      </View>

      <View style={styles.pageHeader}>
        <Kicker color={colors.primary}>{catalog.kicker}</Kicker>
        <Text style={styles.title}>{catalog.title}</Text>
        <Text style={styles.description}>{catalog.description}</Text>
      </View>

      {error && items.length === 0 ? (
        <ErrorState
          title="Catalog unavailable"
          message={error}
          onRetry={retry}
          retryLabel="Reload"
        />
      ) : (
        <>
          <PosterGrid
            items={items}
            onPress={openDetail}
            loading={loading}
            skeletonCount={12}
          />

          {!loading && items.length === 0 ? (
            <EmptyState
              title="Nothing here yet"
              message="TMDB has no catalog-ready titles for this page. Check back soon."
              icon={Compass}
            />
          ) : null}

          <Pagination page={page} totalPages={totalPages} onChange={goTo} />
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl },
  topBar: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'flex-start',
  },
  pageHeader: { paddingHorizontal: spacing.xl, marginBottom: spacing.xl },
  title: {
    fontFamily: fonts.displayBlack,
    fontSize: 32,
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
});
