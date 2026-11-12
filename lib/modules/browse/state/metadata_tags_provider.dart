import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:anifox/modules/tracking/models/models/tracker_filter_options.dart';
import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/streaming/streaming_providers.dart';

class MetadataTagsState {
  final TrackerFilterOptions options;

  const MetadataTagsState({this.options = const TrackerFilterOptions()});

  List<String> get genres => options.genres;
  List<String> get tags => options.tags;
}

final metadataTagsProvider = FutureProvider.autoDispose<MetadataTagsState>(
  retry: (retryCount, error) => null,
  (ref) async {
    ref.keepAlive();
    final source = ref.watch(metadataSourceProvider);
    final options = await source.fetchFilterOptions();
    return MetadataTagsState(options: options);
  },
);

typedef DiscoveryFilterArgs = ({MediaType type, String? sourceId});

final discoveryFiltersProvider = FutureProvider.autoDispose
    .family<MetadataTagsState, DiscoveryFilterArgs>(
      retry: (retryCount, error) => null,
      (ref, args) async {
        ref.keepAlive();
        final tracker = ref.watch(metadataSourceProvider);
        final options = await tracker.fetchFilterOptions(args.type);
        return MetadataTagsState(options: options);
      },
    );
