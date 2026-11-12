import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:anifox/modules/browse/models/models/search_filter_options.dart';
import 'package:anifox/modules/tracking/models/models/tracker_category.dart';
import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/common/state/content_prefs_provider.dart';
import 'package:anifox/streaming/models/paginated_result.dart';
import 'package:anifox/streaming/streaming_providers.dart';

@immutable
class SearchArgs {
  final String query;
  final String? category;
  final MediaType type;
  final List<String> genres;
  final List<String> tags;
  final String? source;
  final List<String> sources;
  final SearchSort sort;
  final SearchStatusFilter status;
  final SearchFormatFilter format;

  const SearchArgs({
    this.query = '',
    this.category,
    this.type = MediaType.ANIME,
    this.genres = const [],
    this.tags = const [],
    this.source,
    this.sources = const [],
    this.sort = SearchSort.popularity,
    this.status = SearchStatusFilter.all,
    this.format = SearchFormatFilter.all,
  });

  bool get isEmpty =>
      query.isEmpty &&
      (category == null || category!.isEmpty) &&
      genres.isEmpty &&
      tags.isEmpty &&
      source == null &&
      sources.isEmpty &&
      sort == SearchSort.popularity &&
      status == SearchStatusFilter.all &&
      format == SearchFormatFilter.all;

  SearchArgs copyWith({
    String? query,
    String? category,
    bool clearCategory = false,
    MediaType? type,
    List<String>? genres,
    List<String>? tags,
    String? source,
    bool clearSource = false,
    List<String>? sources,
    SearchSort? sort,
    SearchStatusFilter? status,
    SearchFormatFilter? format,
  }) {
    return SearchArgs(
      query: query ?? this.query,
      category: clearCategory ? null : (category ?? this.category),
      type: type ?? this.type,
      genres: genres ?? this.genres,
      tags: tags ?? this.tags,
      source: clearSource ? null : (source ?? this.source),
      sources: sources ?? this.sources,
      sort: sort ?? this.sort,
      status: status ?? this.status,
      format: format ?? this.format,
    );
  }

  @override
  int get hashCode => Object.hash(
    query,
    category,
    type,
    source,
    sort,
    status,
    format,
    Object.hashAll(genres),
    Object.hashAll(tags),
    Object.hashAll(sources),
  );

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! SearchArgs) return false;

    return query == other.query &&
        category == other.category &&
        type == other.type &&
        source == other.source &&
        sort == other.sort &&
        status == other.status &&
        format == other.format &&
        const ListEquality().equals(genres, other.genres) &&
        const ListEquality().equals(tags, other.tags) &&
        const ListEquality().equals(sources, other.sources);
  }
}

final searchProvider = AsyncNotifierProvider.autoDispose
    .family<SearchNotifier, PaginatedResult<UnifiedMedia>?, SearchArgs>(
      SearchNotifier.new,
      name: 'searchProvider',
    );

class SearchNotifier extends AsyncNotifier<PaginatedResult<UnifiedMedia>?> {
  int _currentPage = 1;
  bool _isFetchingNextPage = false;
  SearchArgs arg;

  SearchNotifier(this.arg);

  @override
  Future<PaginatedResult<UnifiedMedia>?> build() async {
    _currentPage = 1;
    _isFetchingNextPage = false;
    if (arg.isEmpty) return null;
    return _fetchPage(1);
  }

  Future<PaginatedResult<UnifiedMedia>> _fetchPage(int page) async {
    // If this is a category browse request (e.g. Popular, Top Rated, Trending)
    if (arg.category != null && arg.category!.isNotEmpty) {
      return _fetchCategoryPage(page);
    }

    final engine = ref.read(metadataSourceProvider);
    final adultMode = ref.read(contentPrefsProvider).adultContentMode;
    return await engine.search(
      arg.query,
      type: arg.type,
      page: page,
      adultMode: adultMode,
      genres: arg.genres,
      tags: arg.tags,
      sort: arg.sort,
      status: arg.status,
      format: arg.format,
    );
  }

  Future<PaginatedResult<UnifiedMedia>> _fetchCategoryPage(int page) async {
    final category = arg.category!;
    {
      final engine = ref.read(metadataSourceProvider);
      final adultMode = ref.read(contentPrefsProvider).adultContentMode;
      final matchedCategory = TrackerCategory.tryFromId(category);

      if (matchedCategory != null) {
        return await engine.getCategoryItems(
          matchedCategory,
          type: arg.type,
          page: page,
          cacheDuration: const Duration(hours: 6),
          adultMode: adultMode,
        );
      } else {
        return await engine.search(
          '',
          type: arg.type,
          page: page,
          genres: [category],
          adultMode: adultMode,
          cacheDuration: const Duration(hours: 6),
        );
      }
    }
  }

  Future<void> loadNextPage() async {
    if (_isFetchingNextPage) return;
    final currentData = state.value;
    if (currentData == null || !currentData.hasNextPage) return;

    _isFetchingNextPage = true;
    _currentPage++;

    try {
      final newPageResult = await _fetchPage(_currentPage);
      if (!ref.mounted) return;
      final newItems = newPageResult.items;
      final hasNext = newPageResult.hasNextPage && newItems.isNotEmpty;
      state = AsyncData(
        PaginatedResult(
          items: [...currentData.items, ...newItems],
          hasNextPage: hasNext,
        ),
      );
    } catch (e, _) {
      if (!ref.mounted) return;
      _currentPage--;
      state = AsyncData(
        PaginatedResult(items: currentData.items, hasNextPage: false),
      );
    } finally {
      _isFetchingNextPage = false;
    }
  }
}
