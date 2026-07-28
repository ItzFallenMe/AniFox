import 'package:anifox/core/data/types.dart';
import 'package:anifox/core/database/anilist/types.dart';
import 'package:anifox/ui/theme/types.dart';
// import 'package:flutter_dotenv/flutter_dotenv.dart';

//saved anilist data
UserModal? storedUserData;

//saved settings
SettingsModal? currentUserSettings;

//user prefs
UserPreferencesModal? userPreferences;

//saved theme
late AniFoxTheme appTheme;

late String animeOnsenToken;