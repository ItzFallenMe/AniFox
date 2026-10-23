package com.itzfallenme.anifox.offline

import android.content.Intent
import android.net.Uri
import androidx.media3.common.MimeTypes
import androidx.media3.exoplayer.offline.Download
import androidx.media3.exoplayer.offline.DownloadRequest
import androidx.media3.exoplayer.offline.DownloadService
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

/**
 * `NativeModules.AnifoxDownloads`.
 *
 * JS supplies the manifest URL captured from the player; this module attaches
 * the player's cookies/referer, queues a Media3 download and exposes progress.
 */
class DownloadsModule(
    reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "AnifoxDownloads"

    @ReactMethod
    fun enqueue(request: ReadableMap, promise: Promise) {
        try {
            val id = request.getString("id")
            val url = request.getString("url")
            if (id.isNullOrBlank() || url.isNullOrBlank()) {
                promise.resolve(false)
                return
            }
            val title = request.getString("title").orEmpty()
            val mimeType = request.getString("mimeType") ?: MimeTypes.APPLICATION_M3U8
            val referer = request.getString("referer")

            val headers = OfflineDownloads.headersFor(url, referer)
            val downloadRequest = DownloadRequest.Builder(id, Uri.parse(url))
                .setMimeType(mimeType)
                .setData(OfflineDownloads.serializeHeaders(headers))
                .build()

            DownloadService.sendAddDownload(
                reactApplicationContext,
                AnifoxDownloadService::class.java,
                downloadRequest,
                true,
            )
            android.util.Log.d("AnifoxDownloads", "Queued $title ($id)")
            promise.resolve(true)
        } catch (error: Throwable) {
            promise.reject("E_DOWNLOAD_ENQUEUE", error.message, error)
        }
    }

    @ReactMethod
    fun remove(id: String, promise: Promise) {
        try {
            DownloadService.sendRemoveDownload(
                reactApplicationContext,
                AnifoxDownloadService::class.java,
                id,
                false,
            )
            promise.resolve(true)
        } catch (error: Throwable) {
            promise.reject("E_DOWNLOAD_REMOVE", error.message, error)
        }
    }

    @ReactMethod
    fun list(promise: Promise) {
        try {
            val array = Arguments.createArray()
            val cursor = OfflineDownloads.manager(reactApplicationContext)
                .downloadIndex
                .getDownloads()
            try {
                while (cursor.moveToNext()) {
                    val download = cursor.download
                    array.pushMap(Arguments.createMap().apply {
                        putString("id", download.request.id)
                        putInt("state", download.state)
                        putDouble(
                            "percent",
                            if (download.percentDownloaded < 0f) 0.0
                            else download.percentDownloaded.toDouble(),
                        )
                        putDouble("bytesDownloaded", download.bytesDownloaded.toDouble())
                        putDouble("contentLength", download.contentLength.toDouble())
                        if (download.failureReason != Download.FAILURE_REASON_NONE) {
                            putInt("failureReason", download.failureReason)
                        }
                    })
                }
            } finally {
                cursor.close()
            }
            promise.resolve(array)
        } catch (error: Throwable) {
            promise.resolve(Arguments.createArray())
        }
    }

    @ReactMethod
    fun play(id: String, url: String, title: String, mimeType: String?, promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, OfflinePlayerActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                putExtra(OfflinePlayerActivity.EXTRA_URL, url)
                putExtra(OfflinePlayerActivity.EXTRA_TITLE, title)
                putExtra(OfflinePlayerActivity.EXTRA_MIME, mimeType)
            }
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (error: Throwable) {
            promise.reject("E_OFFLINE_PLAY", error.message, error)
        }
    }
}
