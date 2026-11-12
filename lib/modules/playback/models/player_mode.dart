import 'package:anifox/common/models/unified_episode.dart';
import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/streaming/models/stream_source.dart';

sealed class PlayerMode {
  const PlayerMode();
}

class PlayerModeOnline extends PlayerMode {
  final UnifiedMedia media;
  final UnifiedEpisode episode;
  final StreamSource sourceInfo;
  final Duration? startPosition;

  const PlayerModeOnline({
    required this.media,
    required this.episode,
    required this.sourceInfo,
    this.startPosition,
  });
}

class PlayerModeOffline extends PlayerMode {
  final String filePath;
  final String? title;

  const PlayerModeOffline({required this.filePath, this.title});
}
