# Discord Rich Presence

The Flutter app publishes title and episode presence while a player is open.
Android binds to Discord's Social SDK RPC service; Windows, macOS, and Linux
use `dart_discord_presence` and the Discord desktop client.

## Configure the app

1. Create an application in the [Discord Developer Portal](https://discord.com/developers/applications).
2. Set its application ID as `DISCORD_APPLICATION_ID` in the root `.env`.
3. Run or build Flutter through the root wrapper (`npm run flutter -- run` or
   `npm run flutter -- build apk`) so the value from `.env` is forwarded.
4. On Android, install/open Discord. On desktop, keep the Discord client
   running while playing.

The ID is public client configuration, not a secret. When it is unset or the
Discord client is unavailable, presence silently stays inactive and playback
continues normally.

## Platform status

| Platform | Status |
| --- | --- |
| Windows, macOS, Linux | Local desktop RPC integration implemented |
| Android | Native Social SDK RPC service binding implemented |
| iOS | Not implemented; official Discord support requires the Social SDK, OAuth/PKCE account linking, and an iOS SDK bundle |
| Web | Not implemented; Discord requires an Activity integration rather than local RPC |

Android presence requires an installed Discord stable, Canary, PTB, or debug
build and a valid application ID. If Discord is absent, unavailable, or declines
the IPC connection, playback continues normally and AniFox retries quietly.

Discord's official documentation says iOS Rich Presence requires Social SDK
account linking, a registered `discord-APP_ID:/authorize/callback` redirect,
PKCE, and the iOS SDK from the Developer Portal. The app does not bundle that
SDK or request Discord authorization yet, so iOS presence stays disabled rather
than attempting an unsupported local-RPC connection. Web Rich Presence is not
supported outside a Discord Activity.

The desktop RPC package does not provide iOS or browser support. Do not advertise
Rich Presence as an all-platform feature until those integrations are implemented.
