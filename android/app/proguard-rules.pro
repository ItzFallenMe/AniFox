# R8 / ProGuard rules for AniFox release builds.

# --- androidx.window -------------------------------------------------------
# desktop_webview_window and flutter_web_auth_2 pull in androidx.window, whose
# ExtensionsUtil references androidx.window.extensions.WindowExtensions and
# SidecarDeviceState. Those classes only exist in newer androidx.window
# artifacts, so R8 fails the build with "Missing classes detected while
# running R8" when the transitive version is older than the compile SDK.
# Keep the optional extension and sidecar classes.
-dontwarn androidx.window.extensions.**
-keep class androidx.window.extensions.** { *; }
-dontwarn androidx.window.sidecar.**
-keep class androidx.window.sidecar.** { *; }

# --- Kotlin metadata -------------------------------------------------------
# Several plugins (better_player, dynamic_color, flutter_web_auth_2,
# home_widget, url_launcher_android) still apply the Kotlin Gradle Plugin.
-keepattributes *Annotation*, InnerClasses, Signature, RuntimeVisible*
-keepclassmembers class ** {
    @androidx.annotation.Keep <methods>;
}

# --- Flutter / Dart --------------------------------------------------------
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }
-dontwarn io.flutter.embedding.**

# --- Reflux / Hive / plugins that use reflection ---------------------------
-keep class io.hive.** { *; }
-keep class com.itzfallenme.anifox.** { *; }
-dontwarn com.google.**, com.facebook.**

# --- Better Player / FVP (media3 + ExoPlayer) -----------------------------
-keep class androidx.media3.** { *; }
-dontwarn androidx.media3.**

# --- OkHttp / networking ---------------------------------------------------
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }

# --- Desugaring ------------------------------------------------------------
-dontwarn javax.annotation.**
-dontwarn sun.misc.**