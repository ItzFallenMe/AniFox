package com.itzfallenme.anifox.offline

import android.net.Uri
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.media3.common.MediaItem
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.datasource.cache.CacheDataSource
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.ui.PlayerView

/**
 * Plays a downloaded title from the shared Media3 cache.
 *
 * The original manifest URL is used as the media item; the cache data source
 * serves the manifest and segments from disk, so playback works offline. If a
 * segment is missing it falls back to the network.
 */
class OfflinePlayerActivity : AppCompatActivity() {

    private var player: ExoPlayer? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val url = intent.getStringExtra(EXTRA_URL)
        if (url.isNullOrBlank()) {
            finish()
            return
        }
        setTitle(intent.getStringExtra(EXTRA_TITLE).orEmpty())

        val cacheFactory = CacheDataSource.Factory()
            .setCache(OfflineDownloads.cache(this))
            .setUpstreamDataSourceFactory(DefaultHttpDataSource.Factory())
            .setFlags(CacheDataSource.FLAG_IGNORE_CACHE_ON_ERROR)

        val exoPlayer = ExoPlayer.Builder(this)
            .setMediaSourceFactory(DefaultMediaSourceFactory(cacheFactory))
            .build()

        val playerView = PlayerView(this).apply {
            player = exoPlayer
            setShowNextButton(false)
            setShowPreviousButton(false)
            keepScreenOn = true
        }

        setContentView(playerView)
        val mimeType = intent.getStringExtra(EXTRA_MIME)
        val mediaItem = MediaItem.Builder()
            .setUri(Uri.parse(url))
            .apply { if (!mimeType.isNullOrBlank()) setMimeType(mimeType) }
            .build()
        exoPlayer.setMediaItem(mediaItem)
        exoPlayer.prepare()
        exoPlayer.playWhenReady = true
        player = exoPlayer
    }

    override fun onStart() {
        super.onStart()
        player?.play()
    }

    override fun onStop() {
        super.onStop()
        player?.pause()
    }

    override fun onDestroy() {
        super.onDestroy()
        player?.release()
        player = null
    }

    companion object {
        const val EXTRA_URL = "offline_url"
        const val EXTRA_TITLE = "offline_title"
        const val EXTRA_MIME = "offline_mime"
    }
}
