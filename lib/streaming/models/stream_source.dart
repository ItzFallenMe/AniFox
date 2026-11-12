import 'package:anifox/common/models/unified_media.dart';

/// How a source delivers content to the app.
///
/// AniFox ships with its own embed sources. User-managed source integrations
/// are intentionally not part of the application.
enum StreamSourceKind { builtin }

/// A playable source shown in the episode panel and source picker.
class StreamSource {
  final String id;
  final String name;
  final StreamSourceKind kind;
  final MediaType mediaType;
  final String baseUrl;
  final String? iconUrl;
  final String? lang;
  final String? tagline;
  final bool isNsfw;
  final bool supportsTmdb;
  final bool supportsAniList;
  final bool supportsMal;

  const StreamSource({
    required this.id,
    required this.name,
    required this.kind,
    required this.mediaType,
    required this.baseUrl,
    this.iconUrl,
    this.lang,
    this.tagline,
    this.isNsfw = false,
    this.supportsTmdb = false,
    this.supportsAniList = false,
    this.supportsMal = false,
  });

  String get host {
    final uri = Uri.tryParse(baseUrl);
    return uri?.host.replaceFirst('www.', '') ?? name;
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is StreamSource &&
          id == other.id &&
          kind == other.kind &&
          mediaType == other.mediaType;

  @override
  int get hashCode => Object.hash(id, kind, mediaType);

  Map<String, dynamic> toMap() => {
    'id': id,
    'name': name,
    'kind': kind.name,
    'mediaType': mediaType.name,
    'baseUrl': baseUrl,
    'iconUrl': iconUrl,
    'lang': lang,
    'isNsfw': isNsfw,
  };

  factory StreamSource.fromMap(Map<String, dynamic> map) {
    return StreamSource(
      id: map['id']?.toString() ?? '',
      name: map['name']?.toString() ?? '',
      // Older preference records may contain a removed source kind. Treat
      // those records as built-in sources instead of restoring integrations.
      kind: StreamSourceKind.builtin,
      mediaType: MediaType.values.firstWhere(
        (value) => value.name == map['mediaType'],
        orElse: () => MediaType.ANIME,
      ),
      baseUrl: map['baseUrl']?.toString() ?? '',
      iconUrl: map['iconUrl']?.toString(),
      lang: map['lang']?.toString(),
      isNsfw: map['isNsfw'] == true,
    );
  }
}
