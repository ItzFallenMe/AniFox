import 'package:anifox/modules/tracking/models/models/tracked_status.dart';

class TrackedListItem {
  final String? id;
  final TrackedStatus status;
  final double progress;
  final double? score;

  const TrackedListItem({
    required this.status,
    required this.progress,
    this.score,
    this.id,
  });
}
