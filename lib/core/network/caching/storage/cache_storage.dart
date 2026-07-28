import 'package:anifox/core/network/caching/domain/cache_entry.dart';

abstract class CacheStorage {
  Future<void> init();
  Future<CacheEntry?> get(String key);
  Future<void> put(String key, CacheEntry entry);
  Future<void> delete(String key);
  Future<int> deleteExpired(DateTime now);
  Future<int> getCacheSize();
  Future<void> clear();
  Future<List<CacheEntry>> getAll();
  Future<void> deleteKeys(List<String> keys);
}
