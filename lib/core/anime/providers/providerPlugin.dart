import 'package:anifox/core/anime/extensions/extension_manager.dart';
import 'package:anifox/core/anime/providers/animeProvider.dart';
import 'package:anifox/ui/models/sources.dart' show getClass;

/// Resolves a provider identifier to an executable [AnimeProvider].
///
/// Resolution order (AniFox v2, ShonenX-inspired):
/// 1. Inbuilt native providers ([getClass]) — always available.
/// 2. Installed extensions via [ExtensionManager.resolveProvider]
///    (Mangayomi JS adapter, etc.).
/// 3. Legacy dynamic Dart code path — requires a Dart runtime bridge
///    (historically `d4rt`/provins). Without the bridge, returns `null`
///    with a clear error so the UI can explain it instead of crashing.
///
/// NOTE: `d4rt` execution was disabled upstream (commented out). v2 keeps the
/// plugin API stable while routing remote Dart sources through native
/// implementations when identifiers match, and through the JS adapter
/// otherwise. To restore full arbitrary-Dart execution, add `d4rt` and
/// re-enable the bridge in this file.
class ProviderPlugin {
  ProviderPlugin();

  final Map<String, AnimeProvider> _cache = {};

  Future<AnimeProvider?> getProvider(String identifier, {String? testCode}) async {
    if (identifier.isEmpty && testCode == null) return null;
    final cacheKey = testCode != null ? 'test:$identifier' : identifier;
    final cached = _cache[cacheKey];
    if (cached != null) return cached;

    // 1. Inbuilt native providers.
    try {
      final native = getClass(identifier);
      _cache[cacheKey] = native;
      return native;
    } catch (_) {
      // Not inbuilt — continue to extensions.
    }

    // 2. Installed extensions (Mangayomi JS, etc.).
    try {
      final extProvider = await ExtensionManager.instance.resolveProvider(identifier);
      if (extProvider != null) {
        _cache[cacheKey] = extProvider;
        return extProvider;
      }
      // Also try short id form ("repo:id" vs "id").
      final all = await ExtensionManager.instance.getInstalled();
      for (final ext in all) {
        if (ext.id.endsWith(':$identifier') || ext.id == identifier) {
          final resolved = await ExtensionManager.instance.resolveProvider(ext.id);
          if (resolved != null) {
            _cache[cacheKey] = resolved;
            return resolved;
          }
        }
      }
    } catch (_) {}

    // 3. Legacy dynamic path unavailable — explain instead of crash.
    // ignore: avoid_print
    print('[ProviderPlugin] No executable provider for "$identifier". '
        'Remote Dart execution needs a runtime bridge; install the matching native/extension source instead.');
    return null;
  }

  void invalidate(String identifier) {
    _cache.remove(identifier);
    _cache.remove('test:$identifier');
  }

  void clearCache() => _cache.clear();
}
