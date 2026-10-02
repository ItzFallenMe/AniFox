import 'package:anifox/core/network/caching/cache_config.dart';

abstract class CacheConfigStorage {
  Future<CacheConfig?> load();
  Future<void> save(CacheConfig config);
}
