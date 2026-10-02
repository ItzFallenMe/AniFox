class CacheEntry {
  String key;
  List<int> bodyBytes;
  String? etag;
  String? lastModified;
  DateTime expiry;

  CacheEntry({
    required this.key,
    required this.bodyBytes,
    this.etag,
    this.lastModified,
    required this.expiry,
  });

  factory CacheEntry.fromMap(Map<dynamic, dynamic> map) {
    return CacheEntry(
      key: map['key'] as String? ?? '',
      bodyBytes: (map['bodyBytes'] as List<dynamic>? ?? [])
          .map((e) => e as int)
          .toList(),
      etag: map['etag'] as String?,
      lastModified: map['lastModified'] as String?,
      expiry: DateTime.fromMillisecondsSinceEpoch(map['expiry'] as int? ?? 0),
    );
  }

  Map<dynamic, dynamic> toMap() {
    return {
      'key': key,
      'bodyBytes': bodyBytes,
      'etag': etag,
      'lastModified': lastModified,
      'expiry': expiry.millisecondsSinceEpoch,
    };
  }
}
