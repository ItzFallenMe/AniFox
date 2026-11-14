import 'dart:io' show Platform;

import 'package:anifox/core/utils/env.dart';
import 'package:dart_discord_presence/dart_discord_presence.dart';
import 'package:flutter/services.dart';

/// Discord Rich Presence for Android Social SDK RPC and desktop local RPC.
class DiscordPresenceService {
  DiscordPresenceService._();

  static final instance = DiscordPresenceService._();

  static const _androidChannel = MethodChannel(
    'dev.itzfallenme.anifox/discord_presence',
  );

  DiscordRPC? _rpc;
  String? _applicationId;

  bool get _isSupportedDesktop =>
      Platform.isWindows || Platform.isMacOS || Platform.isLinux;

  Future<void> startWatching({required String title, required String state}) async {
    final applicationId = Env.DISCORD_APPLICATION_ID.trim();
    if (applicationId.isEmpty) return;

    if (Platform.isAndroid) {
      try {
        await _androidChannel.invokeMethod<void>('start', {
          'applicationId': applicationId,
          'title': title,
          'state': state,
        });
      } catch (_) {
        // Native RPC is optional; it must never affect playback.
      }
      return;
    }

    if (!_isSupportedDesktop || !DiscordRPC.isAvailable) return;

    try {
      if (_rpc == null || _applicationId != applicationId) {
        await _disposeRpc();
        final rpc = DiscordRPC();
        await rpc.initialize(applicationId);
        _rpc = rpc;
        _applicationId = applicationId;
      }
      await _rpc!.setPresence(
        DiscordPresence(
          type: DiscordActivityType.watching,
          details: _truncate(title, 128),
          state: _truncate(state, 128),
          timestamps: DiscordTimestamps.started(DateTime.now()),
        ),
      );
    } catch (_) {
      // Discord is optional; playback should keep working when its client is
      // closed, RPC is unavailable, or the application ID is not configured.
    }
  }

  Future<void> clear() async {
    if (Platform.isAndroid) {
      try {
        await _androidChannel.invokeMethod<void>('clear');
      } catch (_) {
        // Best-effort cleanup for an optional native integration.
      }
      return;
    }

    try {
      await _rpc?.clearPresence();
    } catch (_) {
      // A failed RPC clear should not interrupt navigation or playback.
    }
  }

  Future<void> dispose() => _disposeRpc();

  Future<void> _disposeRpc() async {
    final rpc = _rpc;
    _rpc = null;
    _applicationId = null;
    if (rpc == null) return;
    try {
      if (rpc.isConnected) await rpc.clearPresence();
      await rpc.dispose();
    } catch (_) {
      // Best-effort cleanup for an optional desktop integration.
    }
  }

  String _truncate(String value, int maxLength) =>
      value.length <= maxLength ? value : value.substring(0, maxLength);
}
