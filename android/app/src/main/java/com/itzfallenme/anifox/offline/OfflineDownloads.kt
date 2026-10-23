package com.itzfallenme.anifox.offline

import android.content.Context
import android.webkit.CookieManager
import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.database.StandaloneDatabaseProvider
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.datasource.cache.CacheDataSource
import androidx.media3.datasource.cache.NoOpCacheEvictor
import androidx.media3.datasource.cache.SimpleCache
import androidx.media3.exoplayer.hls.offline.HlsDownloader
import androidx.media3.exoplayer.offline.DefaultDownloadIndex
import androidx.media3.exoplayer.offline.DownloadManager
import androidx.media3.exoplayer.offline.DownloadRequest
import androidx.media3.exoplayer.offline.Downloader
import androidx.media3.exoplayer.offline.DownloaderFactory
import androidx.media3.exoplayer.offline.ProgressiveDownloader
import org.json.JSONObject
import java.io.File
import java.util.concurrent.Executor
import java.util.concurrent.Executors

/**
 * Shared Media3 cache, download index and manager.
 *
 * One `SimpleCache` serves downloads and offline playback. Request headers
 * (WebView cookies, player page as referer) are carried on each
 * DownloadRequest and re-applied by [HeaderDownloaderFactory], because most
 * providers reject direct manifest/segment requests without them.
 */
object OfflineDownloads {
    private const val USER_AGENT =
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/124.0 Mobile Safari/537.36"

    @Volatile private var cacheInstance: SimpleCache? = null
    @Volatile private var databaseInstance: StandaloneDatabaseProvider? = null
    @Volatile private var managerInstance: DownloadManager? = null

    fun cache(context: Context): SimpleCache = cacheInstance ?: synchronized(this) {
        cacheInstance ?: SimpleCache(
            File(context.filesDir, "offline_media"),
            NoOpCacheEvictor(),
            database(context),
        ).also { cacheInstance = it }
    }

    fun database(context: Context): StandaloneDatabaseProvider =
        databaseInstance ?: synchronized(this) {
            databaseInstance ?: StandaloneDatabaseProvider(context).also {
                databaseInstance = it
            }
        }

    fun manager(context: Context): DownloadManager = managerInstance ?: synchronized(this) {
        managerInstance ?: DownloadManager(
            context,
            DefaultDownloadIndex(database(context)),
            HeaderDownloaderFactory(context),
        ).also { managerInstance = it }
    }

    /** Headers the provider's player would have sent for this manifest. */
    fun headersFor(url: String, referer: String?): Map<String, String> {
        val headers = mutableMapOf<String, String>()
        headers["User-Agent"] = USER_AGENT
        if (!referer.isNullOrBlank()) headers["Referer"] = referer
        val cookie = CookieManager.getInstance().getCookie(url)
        if (!cookie.isNullOrBlank()) headers["Cookie"] = cookie
        return headers
    }

    fun serializeHeaders(headers: Map<String, String>): ByteArray =
        JSONObject().apply {
            headers.forEach { (key, value) -> put(key, value) }
        }.toString().toByteArray()
}

private class HeaderDownloaderFactory(
    private val context: Context,
) : DownloaderFactory {
    private val executor: Executor = Executors.newFixedThreadPool(4)

    override fun createDownloader(request: DownloadRequest): Downloader {
        val headers = headersOf(request)
        val httpFactory = DefaultHttpDataSource.Factory()
            .setUserAgent(headers["User-Agent"])
            .setDefaultRequestProperties(headers)
        val cacheFactory = CacheDataSource.Factory()
            .setCache(OfflineDownloads.cache(context))
            .setUpstreamDataSourceFactory(DefaultDataSource.Factory(context, httpFactory))

        val mediaItem = MediaItem.Builder()
            .setUri(request.uri)
            .setCustomCacheKey(request.customCacheKey)
            .build()

        return if (request.mimeType == MimeTypes.APPLICATION_M3U8) {
            HlsDownloader(mediaItem, cacheFactory, executor)
        } else {
            ProgressiveDownloader(mediaItem, cacheFactory, executor)
        }
    }

    private fun headersOf(request: DownloadRequest): Map<String, String> = try {
        val json = JSONObject(String(request.data))
        val headers = mutableMapOf<String, String>()
        json.keys().forEach { key -> headers[key] = json.getString(key) }
        headers
    } catch (_: Throwable) {
        emptyMap()
    }
}
