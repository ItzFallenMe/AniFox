# Discord Rich Presence

The Social SDK is bundled at `android/app/libs/discord_partner_sdk.aar`
(Discord Social SDK 1.10.19337) and linked through `implementation
fileTree(dir: "libs", ...)`. Its prefab module provides `discordpp.h` and the
per-ABI `libdiscord_partner_sdk.so`, so no extra Gradle dependency is needed.

On Android the SDK publishes presence over RPC to the installed Discord app —
**no account linking, no token, no login** — as long as the Discord app is
signed in. That is the only route this app uses.

> Do not connect with a user token. Copying a token out of the Discord client is
> an automated user account, which Discord's Terms prohibit and which gets
> accounts banned.

## How it fits together

| File | Role |
|------|------|
| `src/main/cpp/discord_presence.cpp` | JNI bridge. One worker thread owns the SDK client, drains calls and pumps `discordpp::RunCallbacks()`. |
| `src/main/cpp/CMakeLists.txt` | Links `discord_partner_sdk::discord_partner_sdk` via prefab. |
| `discord/sdk/DiscordSdkAdapterImpl.kt` | Kotlin adapter behind the existing seam: loads the native libs, hands the SDK the hosting activity, translates presence payloads. |
| `discord/DiscordSdkAdapter.kt` | Interface used by the React Native module (no direct SDK types). |
| `discord/DiscordPresenceModule.kt` | `NativeModules.AnifoxDiscord`. |
| `src/services/discordPresence.ts` | JS API, status and error handling. |

## Requirements

- The application id in `DISCORD_CLIENT_ID` (`src/config/env.ts`) must have the
  **Social SDK enabled** in the Discord Developer Portal.
- The Discord app must be installed on the device; presence is cleared when the
  player closes.

## Build notes

`android/app/build.gradle` enables `buildFeatures.prefab` and
`externalNativeBuild` for `src/main/cpp`. The bridge is built with a static STL
(`c++_static`) because the SDK itself has no STL dependency, which keeps the
APK free of a second libc++ runtime.
