import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:anifox/modules/history/models/models/history_entry.dart';
import 'package:anifox/modules/history/state/history_provider.dart';
import 'package:anifox/modules/reader/models/reader_mode.dart';
import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/modules/tracking/engine/sync_engine.dart';
import 'package:anifox/common/state/security_prefs_provider.dart';
import 'package:anifox/streaming/models/chapter_page.dart';
import 'package:anifox/streaming/sources/manga_api_source.dart';

class ReaderState {
  final ReaderModeOnline mode;
  final AsyncValue<List<ChapterPage>> pages;
  final int currentPage;
  final int totalPages;
  final bool showOverlay;

  const ReaderState({
    required this.mode,
    this.pages = const AsyncValue.loading(),
    this.currentPage = 0,
    this.totalPages = 0,
    this.showOverlay = false,
  });

  ReaderState copyWith({
    ReaderModeOnline? mode,
    AsyncValue<List<ChapterPage>>? pages,
    int? currentPage,
    int? totalPages,
    bool? showOverlay,
  }) {
    return ReaderState(
      mode: mode ?? this.mode,
      pages: pages ?? this.pages,
      currentPage: currentPage ?? this.currentPage,
      totalPages: totalPages ?? this.totalPages,
      showOverlay: showOverlay ?? this.showOverlay,
    );
  }
}

class ReaderNotifier extends Notifier<ReaderState> {
  late final ReaderModeOnline arg;

  ReaderNotifier(this.arg);

  @override
  ReaderState build() {
    final startPage = arg.startPosition == -1
        ? 0
        : (arg.startPosition > 0 ? arg.startPosition - 1 : 0);

    Future.microtask(() => _fetchPages(arg));

    return ReaderState(
      mode: arg,
      currentPage: startPage,
      totalPages: 0,
      showOverlay: false,
    );
  }

  Future<void> _fetchPages(ReaderModeOnline mode) async {
    state = state.copyWith(pages: const AsyncValue.loading());
    try {
      if (mode.media.type != MediaType.MANGA) {
        throw const MangaApiException(
          'The online reader only supports manga chapters.',
        );
      }

      final source = MangaApiSource.fromSource(mode.sourceInfo);
      if (source == null) {
        throw const MangaApiException(
          'Manga reading is not configured. Build AniFox with MANGA_API_URL.',
        );
      }

      final pages = await source.getPages(mode.episode.id);
      if (pages.isEmpty) {
        throw const MangaApiException(
          'This chapter does not contain any readable pages.',
        );
      }
      final currentPage = state.currentPage.clamp(0, pages.length - 1).toInt();
      state = state.copyWith(
        pages: AsyncValue.data(pages),
        currentPage: currentPage,
        totalPages: pages.length,
      );
      _saveHistory(currentPage, pages.length);
    } catch (e, st) {
      state = state.copyWith(pages: AsyncValue.error(e, st));
    }
  }

  void setPage(int page) {
    if (page < 0 || (state.totalPages > 0 && page >= state.totalPages)) return;
    if (state.currentPage == page) return;

    state = state.copyWith(currentPage: page);
    _saveHistory(page, state.totalPages);
  }

  void toggleOverlay() {
    state = state.copyWith(showOverlay: !state.showOverlay);
  }

  void setOverlay(bool show) {
    state = state.copyWith(showOverlay: show);
  }

  void retry() {
    _fetchPages(arg);
  }

  void _saveHistory(int pageIndex, int total) {
    if (total == 0) return;
    if (ref.read(securityPrefsProvider).incognitoMode) return;
    final savedPageNumber = pageIndex + 1;

    final providerId = arg.media.type == MediaType.MANGA
        ? arg.episode.id.split('::').first
        : (arg.media.providerId != arg.media.id ? arg.media.providerId : null);

    final entry = HistoryEntry()
      ..mediaType = MediaType.MANGA.id
      ..itemNumber = arg.episode.number
      ..mediaId = arg.media.id
      ..mediaIdMal = arg.media.idMal
      ..externalIds = arg.media.externalIds
      ..mediaTitle = arg.media.title.getPreferedTitle
      ..cover = arg.media.cover
      ..banner = arg.media.banner
      ..progress = savedPageNumber
      ..total = total
      ..sourceId = arg.sourceInfo.id
      ..sourceName = arg.sourceInfo.name
      ..providerId = providerId
      ..lastUpdated = DateTime.now();

    ref.read(historyRepositoryProvider).saveProgress(entry);
    ref
        .read(syncEngineProvider)
        .processReading(
          media: arg.media,
          chapterNumber: arg.episode.number,
          positionPage: savedPageNumber,
          totalPages: total,
        );
  }
}

final readerProvider = NotifierProvider.autoDispose
    .family<ReaderNotifier, ReaderState, ReaderModeOnline>(
      ReaderNotifier.new,
      name: 'readerProvider',
    );
