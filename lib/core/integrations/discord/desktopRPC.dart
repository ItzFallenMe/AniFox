import 'package:anifox/core/app/env.dart';
import 'package:anifox/core/app/logging.dart';
import 'package:dart_discord_presence/dart_discord_presence.dart';

/// AniFox Discord Rich Presence (desktop only).
///
/// Uses the local Discord client over IPC — no token needed. The application
/// id comes from `--dart-define DISCORD_APP_ID=...` (see `.env_example`).
class DiscordDesktopRPC {
  final _discord = DiscordRPC();
  bool _isInitialized = false;

  Future<void> initiateConnection() async {
    if (_isInitialized) return;
    if (AniFoxEnvironment.discordApplicationId.isEmpty) {
      Logs.app.log("[RPC] DISCORD_APP_ID is empty, skipping connection.");
      return;
    }
    _discord.onError.listen((e) => Logs.app.log("[RPC] ${e.message}"));

    _discord.onReady.listen((val) {
      Logs.app.log("[RPC] Client connected as ${val.user.username}.");
    });

    await _discord.initialize(AniFoxEnvironment.discordApplicationId);
    _isInitialized = true;
  }

  Future<void> updatePresence(DiscordPresence presence) async {
    if (!_isInitialized) {
      await initiateConnection();
      if (!_isInitialized) return;
    }
    await _discord.setPresence(presence);
  }

  Future<void> clearPresence() => _discord.clearPresence();

  Future<void> dispose() async {
    if (!_isInitialized) return;
    _isInitialized = false;
    await _discord.dispose();
  }
}
