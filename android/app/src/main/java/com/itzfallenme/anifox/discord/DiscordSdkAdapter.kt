package com.itzfallenme.anifox.discord

import android.app.Activity
import android.content.Context

/**
 * Thin seam between React Native and Discord's Social SDK.
 *
 * The SDK is distributed as a native artifact (it is not on Maven and has no
 * React Native binding), so it cannot be vendored into this repository. To turn
 * Rich Presence on:
 *
 *  1. Enable the Social SDK for your Discord application and download it.
 *  2. Drop the `.aar`/`.jar` into `android/app/libs/` and add it to Gradle.
 *  3. Implement this interface in
 *     `com.itzfallenme.anifox.discord.sdk.DiscordSdkAdapterImpl` with a single
 *     `(Context)` constructor. It is discovered by reflection at runtime.
 *
 * Until that class exists, `getStatus()` reports `sdkInstalled = false` and the
 * settings toggle stays disabled. No JS changes are required afterwards.
 */
interface DiscordSdkAdapter {
    /** The SDK binds to the Discord app through the hosting activity. */
    fun setEngineActivity(activity: Activity?)

    fun connect(clientId: String)
    fun disconnect()
    fun setActivity(activity: DiscordActivityPayload)
    fun clearActivity()
    fun isConnected(): Boolean

    companion object {
        private const val IMPLEMENTATION =
            "com.itzfallenme.anifox.discord.sdk.DiscordSdkAdapterImpl"

        /** Returns the linked adapter, or `null` when the SDK is absent. */
        fun load(context: Context): DiscordSdkAdapter? =
            try {
                val type = Class.forName(IMPLEMENTATION)
                type.getDeclaredConstructor(Context::class.java)
                    .newInstance(context.applicationContext) as DiscordSdkAdapter
            } catch (_: Throwable) {
                null
            }
    }
}

/** Presence fields mirrored from `DiscordActivity` in `services/discordPresence.ts`. */
data class DiscordActivityPayload(
    val details: String,
    val state: String?,
    val startTimestamp: Long?,
    val largeImage: String?,
    val largeText: String?,
    val smallImage: String?,
    val smallText: String?,
)
