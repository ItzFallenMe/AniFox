import 'package:flutter/widgets.dart';
import 'package:anifox/modules/playback/engine/video_engine.dart';
import 'package:anifox/modules/playback/engine/media_kit/media_kit_engine.dart';
import 'package:anifox/modules/playback/engine/better_player/better_player_engine.dart';
import 'package:anifox/modules/playback/ui/widgets/media_kit/media_kit_settings.dart';
import 'package:anifox/modules/playback/ui/widgets/better_player/better_player_settings.dart';

extension VideoEngineSettingsExt on VideoEngine {
  Widget? buildSettingsView(BuildContext context) {
    if (this is MediaKitEngine) {
      return const MediaKitAdvancedSettings();
    } else if (this is BetterPlayerEngine) {
      return const BetterPlayerSettingsContent();
    }
    return null;
  }
}
