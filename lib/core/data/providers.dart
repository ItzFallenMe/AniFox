import 'package:anifox/core/anime/providers/providerDetails.dart';
import 'package:anifox/core/commons/enums/hiveEnums.dart';
import 'package:hive/hive.dart';

class ProvidersPreferences {
  final _boxKey = HiveBox.animeProviders.boxName;

  Future<ProviderDetails?> getProvider(String identifier) async {
    final box = await Hive.openBox(_boxKey);
    try {
      final raw = box.get(identifier);
      if (raw == null) return null;
      final Map<String, dynamic> provider = Map.from(raw as Map).cast<String, dynamic>();
      return ProviderDetails.fromMap(provider);
    } catch (_) {
      return null;
    } finally {
      await box.close();
    }
  }

  Future<List<ProviderDetails>> listAllProviders() async {
    final box = await Hive.openBox(_boxKey);
    try {
      final List<dynamic> providers = box.values.toList();
      final List<Map<String, dynamic>> mappedList =
          providers.map((it) => Map.from(it as Map).cast<String, dynamic>()).toList();
      return mappedList.map((e) => ProviderDetails.fromMap(e)).toList();
    } catch (_) {
      return [];
    } finally {
      await box.close();
    }
  }

  Future<void> saveProvider(ProviderDetails provider) async {
    final box = await Hive.openBox(_boxKey);
    await box.put(provider.identifier, provider.toMap());
    await box.close();
  }

  Future<void> removeProvider(String identifier) async {
    final box = await Hive.openBox(_boxKey);
    await box.delete(identifier);
    await box.close();
  }
}
