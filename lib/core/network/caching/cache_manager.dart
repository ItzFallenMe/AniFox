import 'package:anifox/core/app/logging.dart';
import 'package:anifox/core/network/caching/cache_config.dart';
import 'package:anifox/core/network/caching/domain/cache_entry.dart';
import 'package:anifox/core/network/caching/storage/cache_storage.dart';
import 'package:anifox/core/network/caching/storage/hive_cache_storage.dart';

class _CacheLog {
  final String scope;
  _CacheLog(this.scope);
  _CacheLog child(String sub) => _CacheLog('$scope.$sub');
  void v(String msg) => Logs.app.log('[$scope] [V] $msg');
  void i(String msg) => Logs.app.log('[$scope] [I] $msg');
  void s(String msg) => Logs.app.log('[$scope] [S] $msg');
  void w(String msg) => Logs.app.log('[$scope] [W] $msg');
  void e(String msg, [Object? error, StackTrace? st]) =>
      Logs.app.log('[$scope] [E] $msg ${error != null ? "- $error" : ""}');
}

class CacheManager {
  final _log = _CacheLog('CacheManager');
  final CacheStorage _storage;
  final CacheConfig? _customConfig;

  static CacheManager? _instance;

  factory CacheManager({CacheStorage? storage, CacheConfig? cacheConfig}) {
    if (storage != null || cacheConfig != null) {
      return CacheManager._internal(
        storage: storage ?? HiveCacheStorage(),
        cacheConfig: cacheConfig,
      );
    }
    return _instance ??= CacheManager._internal(storage: HiveCacheStorage());
  }

  CacheManager._internal({
    required CacheStorage storage,
    CacheConfig? cacheConfig,
  }) : _storage = storage,
       _customConfig = cacheConfig {
    _initCleanup();
  }

  CacheConfig get cacheConfig =>
      _customConfig ?? CacheConfigController.instance.value;

  Future<void> _initCleanup() async {
    await _storage.init();
    await clearExpired();
    await _enforceMaxCacheSize();
  }

  Future<void> _enforceMaxCacheSize() async {
    final log = _log.child('enforceMaxCacheSize');
    try {
      final maxSize = cacheConfig.maxCacheSize;
      final currentSize = await getCacheSize();
      if (currentSize <= maxSize) {
        return;
      }

      final entries = await _storage.getAll();
      entries.sort((a, b) => a.expiry.compareTo(b.expiry));

      final keysToDelete = <String>[];
      int bytesCleared = 0;

      for (final entry in entries) {
        keysToDelete.add(entry.key);
        bytesCleared += entry.bodyBytes.length;
        if (currentSize - bytesCleared <= maxSize) {
          break;
        }
      }

      if (keysToDelete.isNotEmpty) {
        await _storage.deleteKeys(keysToDelete);
        log.s(
          'Pruned ${keysToDelete.length} entries, cleared approx $bytesCleared bytes',
        );
      }
    } catch (e, st) {
      log.e('PRUNING FAILED', e, st);
    }
  }

  Future<CacheEntry?> get(String key) async {
    final log = _log.child('get');

    try {
      final entry = await _storage.get(key);

      if (entry == null) {
        log.v('MISS: $key');
        return null;
      }

      if (entry.expiry.isBefore(DateTime.now())) {
        log.i('EXPIRED: $key → deleting');
        await delete(key);
        return null;
      }

      log.s('HIT: $key');
      return entry;
    } catch (e, st) {
      log.e('READ FAILED: $key', e, st);
      return null;
    }
  }

  Future<void> put(String key, CacheEntry entry, Duration cacheDuration) async {
    final log = _log.child('put');

    try {
      entry.key = key;
      entry.expiry = DateTime.now().add(cacheDuration);

      await _storage.put(key, entry);

      log.s('STORED: $key (ttl: ${cacheDuration.inMinutes}m)');
    } catch (e, st) {
      log.e('WRITE FAILED: $key', e, st);
    }
  }

  Future<void> delete(String key) async {
    final log = _log.child('delete');

    try {
      await _storage.delete(key);
      log.s('DELETED: $key');
    } catch (e, st) {
      log.e('DELETE FAILED: $key', e, st);
    }
  }

  Future<void> clearExpired() async {
    final log = _log.child('clearExpired');

    try {
      log.w('Cleanup started');
      final now = DateTime.now();
      final count = await _storage.deleteExpired(now);
      log.s('Cleanup done → removed $count');
    } catch (e, st) {
      log.e('CLEANUP FAILED', e, st);
    }
  }

  Future<int> getCacheSize() async {
    final log = _log.child('getCacheSize');

    try {
      return await _storage.getCacheSize();
    } catch (e, st) {
      log.e('SIZE FAILED', e, st);
      return 0;
    }
  }

  Future<void> clearCache() async {
    final log = _log.child('clearCache');

    try {
      log.w('Clearing cache');
      await _storage.clear();
      log.s('Cache cleared');
    } catch (e, st) {
      log.e('CLEAR FAILED', e, st);
    }
  }

  Future<List<CacheEntry>> getAllEntries() async {
    final log = _log.child('getAllEntries');
    try {
      return await _storage.getAll();
    } catch (e, st) {
      log.e('GET ALL ENTRIES FAILED', e, st);
      return [];
    }
  }

  Future<void> deleteEntriesByCategory(String category) async {
    final log = _log.child('deleteEntriesByCategory');
    try {
      final entries = await getAllEntries();
      final keysToDelete = entries
          .where((e) => getCategoryName(e.key) == category)
          .map((e) => e.key)
          .toList();

      if (keysToDelete.isNotEmpty) {
        await _storage.deleteKeys(keysToDelete);
        log.s('Deleted ${keysToDelete.length} entries for category: $category');
      }
    } catch (e, st) {
      log.e('DELETE BY CATEGORY FAILED: $category', e, st);
    }
  }

  String getCategoryName(String key) {
    if (key.contains('/api/anime/search')) return 'Search Queries';
    if (key.contains('/api/anime/eps/')) return 'Episode Metadata';
    if (key.contains('/api/anime/servers/')) return 'Server Lists';
    if (key.contains('/api/anime/oppai/')) return 'Stream Sources';
    return 'General / Others';
  }
}

final cacheManager = CacheManager();
