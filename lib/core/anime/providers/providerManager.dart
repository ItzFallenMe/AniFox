import 'dart:convert';

import 'package:anifox/core/anime/extensions/extension_manager.dart';
import 'package:anifox/core/anime/extensions/extension_models.dart';
import 'package:anifox/core/anime/providers/providerDetails.dart';
import 'package:anifox/core/data/providers.dart';
import 'package:anifox/core/network/network.dart';

/// Manages remote (provins-style) Dart providers + ShonenX-style extension
/// repos (see [ExtensionManager]).
///
/// Kept backwards compatible: existing callers using [fetchProvidersRepo],
/// [fetchProviderCode], [getSavedProviders] keep working. New code should
/// prefer [ExtensionManager] for multi-repo support.
class ProviderManager {
  static const String _fileBaseUrl =
      "https://raw.githubusercontent.com/frostnova721/provins/master/lib/providers/";

  static const String _indexUrl =
      "https://raw.githubusercontent.com/frostnova721/provins/master/index.json";

  final _providersPreferences = ProvidersPreferences();

  /// Get the saved(Installed) provider's code.
  Future<String?> getSavedProviderCode(String providerIdentifier) async {
    try {
      return (await _providersPreferences.getProvider(providerIdentifier))?.code;
    } catch (_) {
      return null;
    }
  }

  /// Get the list of all saved providers.
  Future<List<ProviderDetails>> getSavedProviders() async {
    try {
      return await _providersPreferences.listAllProviders();
    } catch (_) {
      return [];
    }
  }

  /// Save/Install a provider.
  Future<void> saveProvider(ProviderDetails provider) async {
    return await _providersPreferences.saveProvider(provider);
  }

  /// Remove/Uninstall a provider.
  Future<void> removeProvider(ProviderDetails provider) async {
    return await _providersPreferences.removeProvider(provider.identifier);
  }

  /// Fetch the code for the provider from the repo.
  Future<String?> fetchProviderCode(String providerIdentifier) async {
    // Try all enabled Dart repos first (ShonenX-style multi-repo).
    try {
      final repos = (await ExtensionManager.instance.getRepos())
          .where((r) => r.enabled && r.runtime == ExtensionRuntime.dart)
          .toList();
      for (final repo in repos) {
        try {
          String url;
          if (repo.indexUrl.endsWith('index.json')) {
            final base = repo.indexUrl.substring(0, repo.indexUrl.length - 'index.json'.length);
            url = "$base$providerIdentifier/$providerIdentifier.dart";
          } else {
            url = "${repo.indexUrl}/$providerIdentifier.dart";
          }
          final res = await get(Uri.parse(url));
          if (res.statusCode == 200 && res.body.length > 100) return res.body;
        } catch (_) {}
      }
    } catch (_) {}
    final url = _fileBaseUrl + "$providerIdentifier/$providerIdentifier.dart";
    try {
      final res = await get(Uri.parse(url));
      return res.statusCode == 200 ? res.body : null;
    } catch (_) {
      return null;
    }
  }

  /// Yeah, fetch the repo.
  Future<List<ProviderDetails>> fetchProvidersRepo() async {
    // v2: aggregate across all enabled Dart repos via ExtensionManager,
    // falling back to the legacy single index.
    try {
      final available = await ExtensionManager.instance.fetchAvailable();
      final dartExts = available.where((e) => e.runtime == ExtensionRuntime.dart).toList();
      if (dartExts.isNotEmpty) {
        return dartExts
            .map((e) => ProviderDetails(
                  name: e.name,
                  identifier: e.id.split(':').last,
                  version: e.version ?? '1.0.0',
                  icon: e.iconUrl,
                  supportDownloads: e.supportsDownload,
                ))
            .toList();
      }
    } catch (_) {}
    final availableProviders = await get(Uri.parse(_indexUrl));
    final List<dynamic> jsoned = jsonDecode(availableProviders.body) as List<dynamic>;
    final List<Map<String, dynamic>> mapped =
        jsoned.map((e) => Map.from(e as Map).cast<String, dynamic>()).toList();
    final classed = mapped.map((e) => ProviderDetails.fromMap(e)).toList();
    return classed;
  }
}
