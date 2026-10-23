package com.itzfallenme.anifox.orientation

import android.content.pm.ActivityInfo
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil

/**
 * `NativeModules.AnifoxOrientation`.
 *
 * React Native has no core orientation API. The player uses this to open a
 * stream in landscape and hand the device back to the system on exit:
 *
 *  - `lockLandscape()` — sensor landscape, so both left/right rotations work;
 *  - `lockPortrait()` — sensor portrait, used when fullscreen is dismissed;
 *  - `unlock()` — system default, called when the player unmounts.
 *
 * `MainActivity` already declares `configChanges` for orientation, so rotating
 * never recreates the React instance and playback keeps going.
 */
class OrientationModule(
    reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "AnifoxOrientation"

    private fun setOrientation(orientation: Int) {
        UiThreadUtil.runOnUiThread {
            reactApplicationContext.currentActivity?.requestedOrientation = orientation
        }
    }

    @ReactMethod
    fun lockLandscape() {
        setOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE)
    }

    @ReactMethod
    fun lockPortrait() {
        setOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT)
    }

    @ReactMethod
    fun unlock() {
        setOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED)
    }
}
