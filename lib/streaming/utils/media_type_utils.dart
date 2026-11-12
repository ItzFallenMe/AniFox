import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/streaming/models/stream_source.dart';
import 'package:anifox/streaming/catalog.dart';

extension MediaTypeSourceResolution on MediaType {
  FutureProvider<List<StreamSource>> get availableSourcesProvider {
    if (this == MediaType.ANIME ||
        this == MediaType.MOVIE ||
        this == MediaType.TV) {
      return availableAnimeSourcesProvider;
    } else if (this == MediaType.NOVEL) {
      return availableNovelSourcesProvider;
    } else {
      return availableMangaSourcesProvider;
    }
  }

  bool get usesAnimeSources {
    return this == MediaType.ANIME ||
        this == MediaType.MOVIE ||
        this == MediaType.TV;
  }
}
