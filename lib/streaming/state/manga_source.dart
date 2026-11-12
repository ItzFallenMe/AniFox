import 'package:anifox/common/models/unified_chapter.dart';
import 'package:anifox/streaming/models/chapter_page.dart';
import 'package:anifox/streaming/state/media_source.dart';

abstract class MangaSource extends MediaSource {
  Future<List<UnifiedChapter>> getChapters(String mangaId, {bool forceRefresh = false});
  Future<List<ChapterPage>> getPages(String chapterId);
}
