import 'package:anifox/common/models/unified_episode.dart';
import 'package:anifox/common/models/video_server.dart';
import 'package:anifox/common/models/video_stream.dart';
import 'package:anifox/streaming/state/media_source.dart';

abstract class AnimeSource extends MediaSource {
  Future<List<UnifiedEpisode>> getEpisodes(String animeId, {bool forceRefresh = false});
  Future<List<VideoServer>> getServers(String episodeId);
  Future<List<VideoStream>> getSources(String episodeId, VideoServer server);
}
