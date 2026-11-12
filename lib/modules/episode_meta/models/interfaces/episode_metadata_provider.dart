import 'package:anifox/modules/episode_meta/models/models/episode_metadata.dart';
import 'package:anifox/common/models/unified_media.dart';

abstract class EpisodeMetadataProvider {
  String get id;
  String get name;

  Future<String?> resolveId({required UnifiedMedia media});

  Future<List<EpisodeMetadata>> fetchEpisodes({
    required UnifiedMedia media,
    void Function(String message)? onProgress,
  });
}
