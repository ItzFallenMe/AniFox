package com.itzfallenme.anifox.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import com.itzfallenme.anifox.R

class ContinueWatchingWidget : AppWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {
    }

    override fun onDisabled(context: Context) {
    }

    companion object {
        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val prefs = context.getSharedPreferences("HomeWidgetPreferences", Context.MODE_PRIVATE)
            val title = prefs.getString("cw_title", null) ?: "No anime in progress"
            val episode = prefs.getString("cw_episode", null) ?: ""
            val coverUrl = prefs.getString("cw_cover", null)
            val animeId = prefs.getString("cw_id", null) ?: ""

            val views = RemoteViews(context.packageName, R.layout.widget_continue_watching)

            views.setTextViewText(R.id.widget_title, title)
            views.setTextViewText(R.id.widget_episode, episode)

            // Launch app on tap
            val intent = Intent(context, com.itzfallenme.anifox.MainActivity::class.java).apply {
                action = Intent.ACTION_MAIN
                addCategory(Intent.CATEGORY_LAUNCHER)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                if (animeId.isNotEmpty()) {
                    data = Uri.parse("astrm://info?id=$animeId")
                }
            }
            val pendingIntent = PendingIntent.getActivity(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
