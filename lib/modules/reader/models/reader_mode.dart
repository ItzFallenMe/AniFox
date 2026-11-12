import 'package:anifox/common/models/unified_episode.dart';
import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/streaming/models/stream_source.dart';

sealed class ReaderMode {
  const ReaderMode();
}

class ReaderModeOnline extends ReaderMode {
  final UnifiedMedia media;
  final UnifiedEpisode episode; // This represents the chapter
  final StreamSource sourceInfo;
  final int startPosition;

  const ReaderModeOnline({
    required this.media,
    required this.episode,
    required this.sourceInfo,
    this.startPosition = 1,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ReaderModeOnline &&
          runtimeType == other.runtimeType &&
          media.id == other.media.id &&
          episode.id == other.episode.id &&
          sourceInfo.id == other.sourceInfo.id &&
          startPosition == other.startPosition;

  @override
  int get hashCode =>
      media.id.hashCode ^
      episode.id.hashCode ^
      sourceInfo.id.hashCode ^
      startPosition.hashCode;
}

class ReaderModeOffline extends ReaderMode {
  final String filePath; // To be implemented later for downloaded chapters
  final String? title;

  const ReaderModeOffline({required this.filePath, this.title});
}
