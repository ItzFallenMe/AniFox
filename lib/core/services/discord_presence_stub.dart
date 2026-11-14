/// No Rich Presence transport is available in Flutter web.
///
/// Discord only supports web Rich Presence inside an Activity hosted by
/// Discord, not in an ordinary browser tab.
class DiscordPresenceService {
  DiscordPresenceService._();

  static final instance = DiscordPresenceService._();

  Future<void> startWatching({required String title, required String state}) async {}

  Future<void> clear() async {}
}
