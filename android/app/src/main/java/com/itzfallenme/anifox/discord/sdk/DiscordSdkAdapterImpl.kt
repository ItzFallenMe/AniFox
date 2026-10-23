package com.itzfallenme.anifox.discord.sdk

import android.app.Activity
import android.content.Context
import android.util.Log
import com.discord.socialsdk.DiscordSocialSdkInit
import com.itzfallenme.anifox.discord.DiscordActivityPayload
import com.itzfallenme.anifox.discord.DiscordSdkAdapter

/**
 * Discord Social SDK adapter.
 *
 * Presence is published over RPC to the installed Discord app, which is the one
 * path Discord supports on Android without account linking (Social SDK 1.10+).
 * Nothing here authenticates: `Client::SetApplicationId` plus
 * `Client::UpdateRichPresence` is enough while Discord is running.
 *
 * The JNI side lives in `src/main/cpp/discord_presence.cpp`; the SDK itself is
 * the prefab-enabled `discord_partner_sdk.aar` in `app/libs`.
 */
class DiscordSdkAdapterImpl(
    @Suppress("unused") private val context: Context,
) : DiscordSdkAdapter {

    private var connected = false
    private var started = false

    init {
        // The SDK class keeps the engine context; loading it also loads
        // libdiscord_partner_sdk.so, which our bridge links against.
        System.loadLibrary("discord_partner_sdk")
        System.loadLibrary("anifox_discord")
    }

    override fun setEngineActivity(activity: Activity?) {
        if (activity == null) return
        try {
            DiscordSocialSdkInit.setEngineActivity(activity)
        } catch (error: Throwable) {
            Log.w(TAG, "Could not attach the Discord engine activity", error)
        }
    }

    override fun connect(clientId: String) {
        val applicationId = clientId.trim().toLongOrNull()
        require(applicationId != null && applicationId > 0L) {
            "A numeric Discord application ID is required."
        }

        if (!started) {
            nativeStart()
            started = true
        }
        nativeSetApplicationId(applicationId)
        connected = true
        Log.d(TAG, "Rich Presence armed for application $applicationId")
    }

    override fun disconnect() {
        if (started) nativeClearPresence()
        connected = false
    }

    override fun setActivity(activity: DiscordActivityPayload) {
        if (!started) return
        nativeUpdatePresence(
            activity.details,
            activity.state,
            ((activity.startTimestamp ?: 0L) / 1000L).coerceAtLeast(0L),
            activity.largeImage,
            activity.largeText,
        )
    }

    override fun clearActivity() {
        if (started) nativeClearPresence()
    }

    override fun isConnected(): Boolean = connected

    private external fun nativeStart()

    private external fun nativeSetApplicationId(applicationId: Long)

    private external fun nativeUpdatePresence(
        details: String,
        state: String?,
        startSeconds: Long,
        largeImage: String?,
        largeText: String?,
    )

    private external fun nativeClearPresence()

    private companion object {
        const val TAG = "AnifoxDiscord"
    }
}
