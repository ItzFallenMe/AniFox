package com.itzfallenme.anifox.notifications

import android.app.AlarmManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * `NativeModules.AnifoxNotifications`.
 *
 * Uses `AlarmManager.setAndAllowWhileIdle`, which needs no exact-alarm
 * permission and survives the app being swiped away. Alarms do not survive a
 * reboot; a boot receiver would be needed to re-arm them.
 */
class LocalNotificationsModule(
    reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

    private val prefs: SharedPreferences =
        reactContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    init {
        val manager =
            reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        NotificationReceiver.ensureChannel(manager)
    }

    override fun getName(): String = "AnifoxNotifications"

    @ReactMethod
    fun schedule(id: String, title: String, body: String, atMillis: Double, promise: Promise) {
        val context = reactApplicationContext
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
        if (alarmManager == null) {
            promise.resolve(false)
            return
        }

        val at = atMillis.toLong()
        if (at <= System.currentTimeMillis()) {
            // A past air time would fire immediately — treat it as expired.
            promise.resolve(false)
            return
        }

        val pending = pendingIntent(context, id, title, body)
        try {
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending)
            remember(id)
            promise.resolve(true)
        } catch (_: Throwable) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun cancel(id: String, promise: Promise) {
        val context = reactApplicationContext
        val pending = pendingIntent(context, id, "", "")
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
        try {
            alarmManager?.cancel(pending)
            pending.cancel()
            forget(id)
            promise.resolve(true)
        } catch (_: Throwable) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun cancelAll(promise: Promise) {
        scheduledIds().forEach { id ->
            val pending = pendingIntent(reactApplicationContext, id, "", "")
            val alarmManager =
                reactApplicationContext.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
            alarmManager?.cancel(pending)
            pending.cancel()
        }
        prefs.edit().remove(KEY_IDS).apply()
        promise.resolve(true)
    }

    @ReactMethod
    fun getScheduledIds(promise: Promise) {
        val array = Arguments.createArray()
        scheduledIds().forEach { array.pushString(it) }
        promise.resolve(array)
    }

    private fun pendingIntent(
        context: Context,
        id: String,
        title: String,
        body: String,
    ): PendingIntent {
        val intent = Intent(context, NotificationReceiver::class.java).apply {
            action = NotificationReceiver.ACTION_SHOW
            putExtra(NotificationReceiver.EXTRA_ID, id)
            putExtra(NotificationReceiver.EXTRA_TITLE, title)
            putExtra(NotificationReceiver.EXTRA_BODY, body)
        }
        val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        return PendingIntent.getBroadcast(context, id.hashCode(), intent, flags)
    }

    private fun scheduledIds(): Set<String> =
        prefs.getStringSet(KEY_IDS, emptySet())?.toSet().orEmpty()

    private fun remember(id: String) {
        prefs.edit().putStringSet(KEY_IDS, scheduledIds() + id).apply()
    }

    private fun forget(id: String) {
        prefs.edit().putStringSet(KEY_IDS, scheduledIds() - id).apply()
    }

    private companion object {
        const val PREFS = "anifox.alerts"
        const val KEY_IDS = "scheduled_ids"
    }
}
