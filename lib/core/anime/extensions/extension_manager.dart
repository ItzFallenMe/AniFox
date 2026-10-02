import 'dart:convert';

import 'package:anifox/core/anime/extensions/extension_models.dart';
import 'package:anifox/core/anime/extensions/mangayomi_adapter.dart';
import 'package:anifox/core/anime/providers/animeProvider.dart';
import 'package:anifox/core/anime/providers/providerDetails.dart';
import 'package:anifox/core/app/logging.dart';
import 'package:anifox/core/commons/enums/hiveEnums.dart';
import 'package:anifox/core/network/network.dart';
import 'package:hive/hive.dart';

/// ShonenX-inspired extension manager for AniFox.
///
/// Responsibilities (mirrors ShonenX `ExtensionManager` + `source_registry`):
/// - manage extension **repos** ("Settings → Extensions → Manage Repos")
/// - list **available** extensions from all enabled repos
/// - **install / update / remove / enable / disable** extensions
/// - resolve an installed extension to an [AnimeProvider] (native Dart
///   providers run directly, Mangayomi JS runs via [MangayomiExtensionAdapter],
///   Aniyomi/CloudStream entries deep-link to their APK install)
///
/// Persistence uses Hive boxes:
/// - `anime_providers` (existing installed Dart provider code)
/// - `extension_repos` + `extensions` (new v2 boxes, stored under HiveBox.misc
///   keys to avoid migration friction).
class ExtensionManager {
  ExtensionManager._();
  static final ExtensionManager instance = ExtensionManager._();

  /// Default repos shipped with AniFox v2.
  ///
  /// Users can add more via the Extensions settings page (any provins
  /// `index.json` or Mangayomi repo json URL).
  static List<ExtensionRepo> get defaultRepos => [
        const ExtensionRepo(
          id: 'anifox-official',
          name: 'AniFox Official',
          indexUrl: 'https://raw.githubusercontent.com/frostnova721/provins/master/index.json',
          runtime: ExtensionRuntime.dart,
        ),
        const ExtensionRepo(
          id: 'mangayomi-anime',
          name: 'Mangayomi Anime',
          indexUrl: 'https://raw.githubusercontent.com/kodjodevf/mangayomi-extensions/main/index.json',
          runtime: ExtensionRuntime.mangayomi,
        ),
      ];

  static const _reposKey = 'extension_repos_v2';
  static const _extKey = 'extensions_v2';

  Future<List<ExtensionRepo>> getRepos() async {
    final box = await Hive.openBox(HiveBox.misc.boxName);
    final raw = box.get(_reposKey);
    await box.close();
    if (raw == null) return defaultRepos;
    try {
      final list = (jsonDecode(raw as String) as List).cast<Map<String, dynamic>>();
      final repos = list.map(ExtensionRepo.fromMap).toList();
      // Always keep official repo present.
      for (final d in defaultRepos) {
        if (!repos.any((r) => r.id == d.id)) repos.add(d);
      }
      return repos;
    } catch (_) {
      return defaultRepos;
    }
  }

  Future<void> _saveRepos(List<ExtensionRepo> repos) async {
    final box = await Hive.openBox(HiveBox.misc.boxName);
    await box.put(_reposKey, jsonEncode(repos.map((e) => e.toMap()).toList()));
    await box.close();
  }

  Future<void> addRepo(ExtensionRepo repo) async {
    final repos = await getRepos();
    repos.removeWhere((r) => r.id == repo.id || r.indexUrl == repo.indexUrl);
    repos.add(repo);
    await _saveRepos(repos);
  }

  Future<void> removeRepo(String id) async {
    final repos = await getRepos();
    repos.removeWhere((r) => r.id == id);
    // Never allow removing the last repo.
    if (repos.isEmpty) {
      await _saveRepos(defaultRepos);
      return;
    }
    await _saveRepos(repos);
  }

  Future<void> toggleRepo(String id, bool enabled) async {
    final repos = await getRepos();
    final idx = repos.indexWhere((r) => r.id == id);
    if (idx == -1) return;
    final r = repos[idx];
    repos[idx] = ExtensionRepo(id: r.id, name: r.name, indexUrl: r.indexUrl, runtime: r.runtime, enabled: enabled);
    await _saveRepos(repos);
  }

  Future<List<ExtensionSource>> _readInstalled() async {
    final box = await Hive.openBox(HiveBox.misc.boxName);
    final raw = box.get(_extKey);
    await box.close();
    if (raw == null) return [];
    try {
      final list = (jsonDecode(raw as String) as List).cast<Map<String, dynamic>>();
      return list.map(ExtensionSource.fromMap).toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> _saveInstalled(List<ExtensionSource> exts) async {
    final box = await Hive.openBox(HiveBox.misc.boxName);
    await box.put(_extKey, jsonEncode(exts.map((e) => e.toMap()).toList()));
    await box.close();
  }

  Future<List<ExtensionSource>> getInstalled() => _readInstalled();

  /// Fetch available extensions from all enabled repos.
  Future<List<ExtensionSource>> fetchAvailable() async {
    final repos = (await getRepos()).where((r) => r.enabled).toList();
    final installed = await _readInstalled();
    final installedIds = installed.map((e) => e.id).toSet();
    final out = <ExtensionSource>[];

    for (final repo in repos) {
      try {
        final res = await get(Uri.parse(repo.indexUrl));
        if (res.statusCode != 200) continue;
        final parsed = _parseIndex(res.body, repo);
        for (final ext in parsed) {
          if (installedIds.contains(ext.id)) continue;
          out.add(ext);
        }
      } catch (e) {
        Logs.app.log("Extension repo fetch failed (${repo.name}): $e");
      }
    }
    return out;
  }

  /// Parse provins / Mangayomi / AniFox index formats into [ExtensionSource].
  List<ExtensionSource> _parseIndex(String body, ExtensionRepo repo) {
    final decoded = jsonDecode(body);
    final List<dynamic> list;
    if (decoded is List) {
      list = decoded;
    } else if (decoded is Map && decoded['extensions'] is List) {
      list = decoded['extensions'] as List;
    } else {
      return [];
    }
    return list.map<ExtensionSource?>((raw) {
      try {
        final m = Map<String, dynamic>.from(raw as Map);
        final id = (m['identifier'] ?? m['id'] ?? m['pkg'] ?? '').toString();
        final name = (m['name'] ?? id).toString();
        if (id.isEmpty) return null;
        return ExtensionSource(
          id: '${repo.id}:$id',
          name: name,
          type: ExtensionSourceType.extension,
          runtime: repo.runtime,
          version: (m['version'] ?? m['versionName'] ?? '1.0.0').toString(),
          iconUrl: m['icon']?.toString() ?? m['iconUrl']?.toString(),
          baseUrl: m['baseUrl']?.toString() ?? m['host']?.toString(),
          lang: m['lang']?.toString() ?? 'en',
          isNsfw: (m['isNsfw'] ?? m['nsfw'] ?? false) as bool,
          supportsDownload: (m['supportDownloads'] ?? false) as bool,
        );
      } catch (_) {
        return null;
      }
    }).whereType<ExtensionSource>().toList();
  }

  /// Fetch raw extension source code/file URL for install.
  Future<String?> fetchExtensionCode(ExtensionSource ext) async {
    // provins layout: <repoBase>/<identifier>/<identifier>.dart
    final repos = await getRepos();
    final repoId = ext.id.split(':').first;
    final repo = repos.firstWhere(
      (r) => r.id == repoId,
      orElse: () => repos.first,
    );
    final shortId = ext.id.split(':').last;
    final candidates = <String>[];
    if (repo.indexUrl.endsWith('index.json')) {
      final base = repo.indexUrl.substring(0, repo.indexUrl.length - 'index.json'.length);
      candidates.add('$base$shortId/$shortId.dart');
      candidates.add('$base$shortId.js');
    }
    if (ext.baseUrl != null) candidates.add(ext.baseUrl!);
    for (final url in candidates) {
      try {
        final res = await get(Uri.parse(url));
        if (res.statusCode == 200 && res.body.length > 100) return res.body;
      } catch (_) {}
    }
    return null;
  }

  Future<void> install(ExtensionSource ext, {String? code}) async {
    final installed = await _readInstalled();
    installed.removeWhere((e) => e.id == ext.id);
    installed.add(ext.copyWith(isInstalled: true, isEnabled: true));

    // Persist Dart provider code in legacy box so ProviderManager keeps working.
    if (code != null && ext.runtime == ExtensionRuntime.dart) {
      final shortId = ext.id.split(':').last;
      final box = await Hive.openBox(HiveBox.animeProviders.boxName);
      await box.put(
        shortId,
        ProviderDetails(
          name: ext.name,
          identifier: shortId,
          version: ext.version ?? '1.0.0',
          icon: ext.iconUrl,
          code: code,
          supportDownloads: ext.supportsDownload,
        ).toMap(),
      );
      await box.close();
    }
    // Cache JS code alongside installed entry.
    if (code != null && ext.runtime == ExtensionRuntime.mangayomi) {
      final box = await Hive.openBox(HiveBox.misc.boxName);
      await box.put('ext_code_${ext.id}', code);
      await box.close();
    }
    await _saveInstalled(installed);
  }

  Future<void> uninstall(String id) async {
    final installed = await _readInstalled();
    installed.removeWhere((e) => e.id == id);
    await _saveInstalled(installed);
    final shortId = id.split(':').last;
    try {
      final box = await Hive.openBox(HiveBox.animeProviders.boxName);
      await box.delete(shortId);
      await box.close();
    } catch (_) {}
    try {
      final box = await Hive.openBox(HiveBox.misc.boxName);
      await box.delete('ext_code_$id');
      await box.close();
    } catch (_) {}
  }

  Future<void> setEnabled(String id, bool enabled) async {
    final installed = await _readInstalled();
    final idx = installed.indexWhere((e) => e.id == id);
    if (idx == -1) return;
    installed[idx] = installed[idx].copyWith(isEnabled: enabled);
    await _saveInstalled(installed);
  }

  Future<String?> getCachedCode(String id) async {
    try {
      final box = await Hive.openBox(HiveBox.misc.boxName);
      final code = box.get('ext_code_$id') as String?;
      await box.close();
      return code;
    } catch (_) {
      return null;
    }
  }

  /// Resolve an installed extension id to an executable [AnimeProvider].
  ///
  /// Returns `null` for Aniyomi/CloudStream entries (APK runtime required).
  Future<AnimeProvider?> resolveProvider(String id) async {
    final installed = await _readInstalled();
    final ext = installed.where((e) => e.id == id).firstOrNull;
    if (ext == null || !ext.isEnabled) return null;
    if (ext.runtime == ExtensionRuntime.mangayomi) {
      final code = await getCachedCode(id);
      if (code == null) return null;
      return MangayomiExtensionAdapter(extension: ext, sourceCode: code);
    }
    if (ext.runtime == ExtensionRuntime.dart) {
      // Dart extensions execute through the legacy plugin path
      // (ProviderPlugin compiles cached code). Returning null here lets
      // SourceManager fall through to that path.
      return null;
    }
    return null; // aniyomi / cloudstream need external runtime
  }

  /// All sources visible to the app: inbuilt + installed extensions.
  Future<List<ExtensionSource>> allSources(List<ExtensionSource> inbuilt) async {
    final installed = (await _readInstalled()).where((e) => e.isEnabled).toList();
    return [...inbuilt, ...installed];
  }
}
