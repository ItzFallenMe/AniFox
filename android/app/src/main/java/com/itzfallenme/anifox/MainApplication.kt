package com.itzfallenme.anifox

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.itzfallenme.anifox.discord.DiscordPresencePackage
import com.itzfallenme.anifox.notifications.LocalNotificationsPackage
import com.itzfallenme.anifox.offline.DownloadsPackage
import com.itzfallenme.anifox.orientation.OrientationPackage

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Manually registered (no autolinking for in-repo native modules).
          add(DiscordPresencePackage())
          add(LocalNotificationsPackage())
          add(DownloadsPackage())
          add(OrientationPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
