import 'package:anifox/core/commons/enums/hiveEnums.dart';
import 'package:anifox/core/network/caching/cache_config.dart';
import 'package:anifox/core/network/caching/storage/cache_config_storage.dart';
import 'package:hive/hive.dart';

class HiveCacheConfigStorage implements CacheConfigStorage {
  final String boxName;
  final String key;

  HiveCacheConfigStorage({String? boxName, this.key = 'cache_config'})
      : boxName = boxName ?? HiveBox.anifox.boxName;

  @override
  Future<CacheConfig?> load() async {
    try {
      if (!Hive.isBoxOpen(boxName)) {
        await Hive.openBox(boxName);
      }
      final box = Hive.box(boxName);
      final map = box.get(key);
      if (map != null && map is Map) {
        return CacheConfig.fromMap(map);
      }
    } catch (_) {}
    return null;
  }

  @override
  Future<void> save(CacheConfig config) async {
    try {
      if (!Hive.isBoxOpen(boxName)) {
        await Hive.openBox(boxName);
      }
      final box = Hive.box(boxName);
      await box.put(key, config.toMap());
    } catch (_) {}
  }
}
