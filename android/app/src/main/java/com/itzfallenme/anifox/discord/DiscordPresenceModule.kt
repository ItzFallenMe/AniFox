package com.itzfallenme.anifox.discord

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

/**
 * `NativeModules.AnifoxDiscord`.
 *
 * Every call resolves instead of rejecting so the JS layer never has to guard
 * playback against a missing SDK.
 */
class DiscordPresenceModule(
    reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

    private val adapter: DiscordSdkAdapter? = DiscordSdkAdapter.load(reactContext)

    override fun getName(): String = "AnifoxDiscord"

    private fun status(reason: String? = null) = Arguments.createMap().apply {
        putBoolean("sdkInstalled", adapter != null)
        putBoolean("connected", adapter?.isConnected() ?: false)
        if (reason != null) putString("reason", reason) else if (adapter == null) {
            putString("reason", "Discord SDK is not linked in this build.")
        }
    }

    @ReactMethod
    fun getStatus(promise: Promise) {
        promise.resolve(status())
    }

    @ReactMethod
    fun connect(clientId: String, promise: Promise) {
        val sdk = adapter
        if (sdk == null) {
            promise.resolve(status("Discord SDK is not linked in this build."))
            return
        }
        if (clientId.isBlank()) {
            promise.resolve(status("A Discord client ID is required."))
            return
        }
        try {
            sdk.connect(clientId)
            promise.resolve(status())
        } catch (error: Throwable) {
            promise.resolve(status(error.message ?: "Could not connect to Discord."))
        }
    }

    @ReactMethod
    fun setActivity(activity: ReadableMap, promise: Promise) {
        val sdk = adapter
        if (sdk == null) {
            promise.resolve(false)
            return
        }
        try {
            sdk.setActivity(
                DiscordActivityPayload(
                    details = activity.getString("details") ?: "",
                    state = activity.getString("state"),
                    startTimestamp = if (activity.hasKey("startTimestamp")) {
                        activity.getDouble("startTimestamp").toLong()
                    } else null,
                    largeImage = activity.getString("largeImage"),
                    largeText = activity.getString("largeText"),
                    smallImage = activity.getString("smallImage"),
                    smallText = activity.getString("smallText"),
                )
            )
            promise.resolve(true)
        } catch (_: Throwable) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun clearActivity(promise: Promise) {
        val sdk = adapter ?: run {
            promise.resolve(false)
            return
        }
        try {
            sdk.clearActivity()
            promise.resolve(true)
        } catch (_: Throwable) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun disconnect(promise: Promise) {
        val sdk = adapter ?: run {
            promise.resolve(false)
            return
        }
        try {
            sdk.disconnect()
            promise.resolve(true)
        } catch (_: Throwable) {
            promise.resolve(false)
        }
    }
}
