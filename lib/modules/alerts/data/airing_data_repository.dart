import 'package:anifox/modules/alerts/models/models/airing_schedule.dart';

abstract class AiringDataRepository {
  Future<List<AiringSchedule>> getAiringSchedule(String mediaId);
}
