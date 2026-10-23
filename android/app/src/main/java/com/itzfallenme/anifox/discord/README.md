# Discord Rich Presence — linking the SDK

AniFox ships the whole bridge; only Discord's native SDK is missing, because
Discord distributes it as a downloadable artifact rather than a Maven package,
and it has no React Native binding.

## 1. Create the Discord application

1. Open <https://discord.com/developers/applications> and create an application.
2. Enable the **Social SDK** for it (Rich Presence on mobile requires it).
3. Copy the **Application ID** into `DISCORD_CLIENT_ID` in
   `src/config/env.ts`.
4. Add the presence artwork (large image key) if you plan to use one.

## 2. Add the SDK to the Android build

1. Download the Android Social SDK artifact from Discord.
2. Put it in `android/app/libs/` and reference it from
   `android/app/build.gradle` (for an `.aar`):

   ```gradle
   implementation fileTree(dir: "libs", include: ["*.aar", "*.jar"])
   ```

3. Rebuild the app (`npm run android`).

## 3. Implement the adapter

Create `android/app/src/main/java/com/itzfallenme/anifox/discord/sdk/DiscordSdkAdapterImpl.kt`
implementing `com.itzfallenme.anifox.discord.DiscordSdkAdapter` with a single
`(Context)` constructor. It is discovered by reflection, so no other file needs
to change.

```kotlin
package com.itzfallenme.anifox.discord.sdk

import android.content.Context
import com.itzfallenme.anifox.discord.DiscordActivityPayload
import com.itzfallenme.anifox.discord.DiscordSdkAdapter
// import discord.socialsdk.*   ← whatever the SDK exposes

class DiscordSdkAdapterImpl(context: Context) : DiscordSdkAdapter {
    private var client: Any? = null

    override fun connect(clientId: String) {
        // Create the Discord client with clientId and connect it.
    }

    override fun disconnect() { /* close the client */ }

    override fun setActivity(activity: DiscordActivityPayload) {
        // Map the payload onto the SDK's activity builder, then update presence.
    }

    override fun clearActivity() { /* clear presence */ }

    override fun isConnected(): Boolean = client != null
}
```

Until this file exists the JS layer reports `sdkInstalled: false`, the Settings
toggle stays disabled, and playback is unaffected. The same applies when the
client ID is left blank.
