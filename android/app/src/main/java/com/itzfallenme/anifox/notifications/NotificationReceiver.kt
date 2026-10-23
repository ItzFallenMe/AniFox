package com.itzfallenme.anifox.notifications

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import com.itzfallenme.anifox.MainActivity
import com.itzfallenme.anifox.R

/** Posts the scheduled "new episode" notification and opens the app on tap. */
class NotificationReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != ACTION_SHOW) return

        val id = intent.getStringExtra(EXTRA_ID) ?: return
        val title = intent.getStringExtra(EXTRA_TITLE) ?: "AniFox"
        val body = intent.getStringExtra(EXTRA_BODY).orEmpty()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            context.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            return
        }

        val manager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
        ensureChannel(manager)

        val tapIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val contentIntent = PendingIntent.getActivity(
            context,
            0,
            tapIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(context, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(context)
        }

        val notification = builder
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(Notification.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setContentIntent(contentIntent)
            .build()

        try {
            manager.notify(id.hashCode(), notification)
        } catch (_: SecurityException) {
            // Permission was revoked after scheduling; nothing to do.
        }
    }

    companion object {
        const val ACTION_SHOW = "com.itzfallenme.anifox.SHOW_EPISODE_ALERT"
        const val EXTRA_ID = "alert_id"
        const val EXTRA_TITLE = "alert_title"
        const val EXTRA_BODY = "alert_body"
        const val CHANNEL_ID = "anifox.episode_alerts"

        fun ensureChannel(manager: NotificationManager) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
            if (manager.getNotificationChannel(CHANNEL_ID) != null) return
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Episode alerts",
                NotificationManager.IMPORTANCE_DEFAULT,
            ).apply {
                description = "New episodes of series you follow"
            }
            manager.createNotificationChannel(channel)
        }
    }
}
