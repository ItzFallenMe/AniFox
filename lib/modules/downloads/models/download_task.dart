enum DownloadStatus { queued, downloading, completed, failed, canceled }

class DownloadTask {
  final String id;
  final String mediaTitle;
  final String episodeLabel;
  final String sourceName;
  final String url;
  final String filePath;
  final int totalUnits;
  final int completedUnits;
  final DownloadStatus status;
  final String? error;
  final DateTime createdAt;

  const DownloadTask({
    required this.id,
    required this.mediaTitle,
    required this.episodeLabel,
    required this.sourceName,
    required this.url,
    required this.filePath,
    this.totalUnits = 0,
    this.completedUnits = 0,
    this.status = DownloadStatus.queued,
    this.error,
    required this.createdAt,
  });

  String get displayTitle =>
      episodeLabel.isEmpty ? mediaTitle : '$mediaTitle · $episodeLabel';

  double get progress {
    if (status == DownloadStatus.completed) return 1;
    if (totalUnits <= 0) return 0;
    return (completedUnits / totalUnits).clamp(0, 1);
  }

  bool get isActive =>
      status == DownloadStatus.queued || status == DownloadStatus.downloading;

  DownloadTask copyWith({
    int? totalUnits,
    int? completedUnits,
    DownloadStatus? status,
    String? error,
    bool clearError = false,
  }) {
    return DownloadTask(
      id: id,
      mediaTitle: mediaTitle,
      episodeLabel: episodeLabel,
      sourceName: sourceName,
      url: url,
      filePath: filePath,
      totalUnits: totalUnits ?? this.totalUnits,
      completedUnits: completedUnits ?? this.completedUnits,
      status: status ?? this.status,
      error: clearError ? null : error ?? this.error,
      createdAt: createdAt,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'mediaTitle': mediaTitle,
    'episodeLabel': episodeLabel,
    'sourceName': sourceName,
    'url': url,
    'filePath': filePath,
    'totalUnits': totalUnits,
    'completedUnits': completedUnits,
    'status': status.name,
    'error': error,
    'createdAt': createdAt.toIso8601String(),
  };

  factory DownloadTask.fromJson(Map<String, dynamic> json) {
    return DownloadTask(
      id: json['id'] as String? ?? '',
      mediaTitle: json['mediaTitle'] as String? ?? 'Unknown',
      episodeLabel: json['episodeLabel'] as String? ?? '',
      sourceName: json['sourceName'] as String? ?? '',
      url: json['url'] as String? ?? '',
      filePath: json['filePath'] as String? ?? '',
      totalUnits: (json['totalUnits'] as num?)?.toInt() ?? 0,
      completedUnits: (json['completedUnits'] as num?)?.toInt() ?? 0,
      status: DownloadStatus.values.firstWhere(
        (item) => item.name == json['status'],
        orElse: () => DownloadStatus.failed,
      ),
      error: json['error'] as String?,
      createdAt:
          DateTime.tryParse(json['createdAt'] as String? ?? '') ??
          DateTime.now(),
    );
  }
}
