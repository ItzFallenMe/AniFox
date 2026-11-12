import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:anifox/core/network/http_client.dart';
import 'package:anifox/modules/alerts/data/anilist_airing_repository.dart';
import 'package:anifox/modules/alerts/data/mal_airing_repository.dart';
import 'package:anifox/modules/alerts/data/airing_data_repository.dart';
import 'package:anifox/modules/tracking/models/models/tracker_type.dart';

final airingDataRepositoryProvider =
    Provider.family<AiringDataRepository, TrackerType>((ref, trackerType) {
      final http = HTTP();
      if (trackerType == TrackerType.myanimelist) {
        return MALAiringRepository(http);
      }
      return AniListAiringRepository(http);
    });
