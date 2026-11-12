import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:anifox/modules/tracking/models/models/tracker_type.dart';
import 'package:anifox/modules/tracking/engine/remote_tracker.dart';
import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/streaming/streaming_providers.dart';

class DetailsArgs {
  final String id;
  final MediaType type;
  final String? sourceId;
  final String? trackerId;

  const DetailsArgs(this.id, this.type, {this.sourceId, this.trackerId});

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is DetailsArgs &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          type == other.type &&
          sourceId == other.sourceId &&
          trackerId == other.trackerId;

  @override
  int get hashCode => Object.hash(id, type, sourceId, trackerId);
}

final detailsProvider = FutureProvider.autoDispose
    .family<UnifiedMedia, DetailsArgs>(retry: (retryCount, error) => null, (
      ref,
      args,
    ) async {
      if (args.trackerId != null) {
        final targetType = TrackerType.tryFromId(args.trackerId!);
        if (targetType != null) {
          final targetTracker = targetType.getTracker(ref) as RemoteTracker;
          return targetTracker.getDetails(args.id, args.type);
        }
      }
      // Tracker Mode: use the metadata tracker.
      final engine = ref.watch(metadataSourceProvider);
      return engine.getDetails(args.id, args.type);
    }, name: 'detailsProvider');
