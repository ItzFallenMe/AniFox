// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

/// Extension source type, mirroring ShonenX's `SourceType`.
enum ExtensionSourceType { inbuilt, extension }

/// Which runtime executes an extension.
///
/// - `dart`: classic provins-style Dart provider code (executed via the
///   in-app adapter registry).
/// - `mangayomi`: Mangayomi-style JS source (ShonenX compatible).
/// - `aniyomi` / `cloudstream`: descriptors for APK-based extensions. AniFox
///   lists them and deep-links install, execution requires the runtime bridge.
enum ExtensionRuntime { dart, mangayomi, aniyomi, cloudstream }

/// A single installable extension source (ShonenX `SourceInfo` equivalent).
class ExtensionSource {
  final String id;
  final String name;
  final ExtensionSourceType type;
  final ExtensionRuntime runtime;
  final String? version;
  final String? iconUrl;
  final String? baseUrl;
  final String? lang;
  final bool isNsfw;
  final bool isInstalled;
  final bool isEnabled;
  final bool supportsDub;
  final bool supportsDownload;

  const ExtensionSource({
    required this.id,
    required this.name,
    required this.type,
    required this.runtime,
    this.version,
    this.iconUrl,
    this.baseUrl,
    this.lang,
    this.isNsfw = false,
    this.isInstalled = false,
    this.isEnabled = true,
    this.supportsDub = true,
    this.supportsDownload = false,
  });

  ExtensionSource copyWith({
    String? id,
    String? name,
    ExtensionSourceType? type,
    ExtensionRuntime? runtime,
    String? version,
    String? iconUrl,
    String? baseUrl,
    String? lang,
    bool? isNsfw,
    bool? isInstalled,
    bool? isEnabled,
    bool? supportsDub,
    bool? supportsDownload,
  }) {
    return ExtensionSource(
      id: id ?? this.id,
      name: name ?? this.name,
      type: type ?? this.type,
      runtime: runtime ?? this.runtime,
      version: version ?? this.version,
      iconUrl: iconUrl ?? this.iconUrl,
      baseUrl: baseUrl ?? this.baseUrl,
      lang: lang ?? this.lang,
      isNsfw: isNsfw ?? this.isNsfw,
      isInstalled: isInstalled ?? this.isInstalled,
      isEnabled: isEnabled ?? this.isEnabled,
      supportsDub: supportsDub ?? this.supportsDub,
      supportsDownload: supportsDownload ?? this.supportsDownload,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'type': type.name,
      'runtime': runtime.name,
      'version': version,
      'iconUrl': iconUrl,
      'baseUrl': baseUrl,
      'lang': lang,
      'isNsfw': isNsfw,
      'isInstalled': isInstalled,
      'isEnabled': isEnabled,
      'supportsDub': supportsDub,
      'supportsDownload': supportsDownload,
    };
  }

  factory ExtensionSource.fromMap(Map<String, dynamic> map) {
    return ExtensionSource(
      id: map['id'] as String,
      name: map['name'] as String,
      type: ExtensionSourceType.values.firstWhere(
        (e) => e.name == map['type'],
        orElse: () => ExtensionSourceType.extension,
      ),
      runtime: ExtensionRuntime.values.firstWhere(
        (e) => e.name == map['runtime'],
        orElse: () => ExtensionRuntime.dart,
      ),
      version: map['version'] as String?,
      iconUrl: map['iconUrl'] as String?,
      baseUrl: map['baseUrl'] as String?,
      lang: map['lang'] as String?,
      isNsfw: (map['isNsfw'] ?? false) as bool,
      isInstalled: (map['isInstalled'] ?? false) as bool,
      isEnabled: (map['isEnabled'] ?? true) as bool,
      supportsDub: (map['supportsDub'] ?? true) as bool,
      supportsDownload: (map['supportsDownload'] ?? false) as bool,
    );
  }

  String toJson() => json.encode(toMap());

  factory ExtensionSource.fromJson(String source) =>
      ExtensionSource.fromMap(json.decode(source) as Map<String, dynamic>);
}

/// An extension repository (ShonenX "Manage Repos" equivalent).
///
/// `indexUrl` points to a JSON list of extensions. Supported formats:
/// - provins `index.json` (`[{name, identifier, version, icon, ...}]`)
/// - Mangayomi repo json (`{extensions: [...]}`)
/// - AniFox native json (`{extensions: [...], runtime: ...}`)
class ExtensionRepo {
  final String id;
  final String name;
  final String indexUrl;
  final ExtensionRuntime runtime;
  final bool enabled;

  const ExtensionRepo({
    required this.id,
    required this.name,
    required this.indexUrl,
    required this.runtime,
    this.enabled = true,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'indexUrl': indexUrl,
      'runtime': runtime.name,
      'enabled': enabled,
    };
  }

  factory ExtensionRepo.fromMap(Map<String, dynamic> map) {
    return ExtensionRepo(
      id: map['id'] as String,
      name: map['name'] as String,
      indexUrl: map['indexUrl'] as String,
      runtime: ExtensionRuntime.values.firstWhere(
        (e) => e.name == map['runtime'],
        orElse: () => ExtensionRuntime.dart,
      ),
      enabled: (map['enabled'] ?? true) as bool,
    );
  }

  String toJson() => json.encode(toMap());

  factory ExtensionRepo.fromJson(String source) =>
      ExtensionRepo.fromMap(json.decode(source) as Map<String, dynamic>);
}
