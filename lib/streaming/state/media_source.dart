import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/streaming/models/stream_source.dart';

abstract class MediaSource {
  StreamSource get sourceInfo;

  Future<List<String>> getFilterGenres() async => const [];

  Future<List<String>> getFilterTags() async => const [];

  Future<List<UnifiedMedia>> search(
    String query,
    MediaType type, {
    int page = 1,
    bool isAdult = false,
    List<String> sort = const ['SEARCH_MATCH'],
    List<String> genres = const [],
    List<String> tags = const [],
    bool forceRefresh = false,
  });

  Future<List<UnifiedMedia>> getTrending({int page = 1}) async => const [];

  Future<UnifiedMedia> getDetails(String providerId, MediaType type);

  @override
  int get hashCode => sourceInfo.id.hashCode ^ sourceInfo.mediaType.hashCode;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is MediaSource &&
        other.sourceInfo.id == sourceInfo.id &&
        other.sourceInfo.name == sourceInfo.name &&
        other.sourceInfo.kind == sourceInfo.kind &&
        other.sourceInfo.mediaType == sourceInfo.mediaType;
  }
}
