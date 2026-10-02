import 'package:anifox/core/commons/enums/hiveEnums.dart';
import 'package:hive/hive.dart';

final String _boxName = HiveBox.anifox.boxName;

Future<int> getTheme() async {
  var box = await Hive.openBox(_boxName);
  if (!box.isOpen) {
    box = await Hive.openBox(_boxName);
  }
  dynamic selectedThemeId = box.get('theme', defaultValue: 00) ?? 00;
  if (selectedThemeId == null || !(selectedThemeId is int)) selectedThemeId = 00;
  await box.close();
  return selectedThemeId;
}

//saves the theme
Future<void> setTheme(int themeId) async {
  var box = await Hive.openBox(_boxName);
  if (!box.isOpen) {
    box = await Hive.openBox(_boxName);
  }
  await box.put('theme', themeId);
  await box.close();
  return;
}
