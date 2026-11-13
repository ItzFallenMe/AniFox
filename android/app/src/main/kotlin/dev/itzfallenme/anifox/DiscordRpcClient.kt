package dev.itzfallenme.anifox

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.os.Build
import android.os.IBinder
import android.os.Process
import android.util.Log
import com.discord.socialsdk.rpc.IDiscordRpcCallback
import com.discord.socialsdk.rpc.IDiscordRpcConnection
import com.discord.socialsdk.rpc.IDiscordRpcService
import org.json.JSONObject
import java.util.UUID
import java.util.concurrent.RejectedExecutionException
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.ScheduledThreadPoolExecutor
import java.util.concurrent.TimeUnit

/** Android Discord Social SDK RPC transport. Discord remains optional. */
internal class DiscordRpcClient(context: Context) {
    private val appContext = context.applicationContext
    private val worker = ScheduledThreadPoolExecutor(1)
    // These fields are only read or written on [worker]. Service callbacks are
    // marshalled there before touching the connection state.
    private var applicationId: Long? = null
    private var pendingFrame: String? = null
    private var rpcConnection: IDiscordRpcConnection? = null
    private var serviceConnection: ServiceConnection? = null
    private var isBound = false
    private var isBinding = false
    private var isShutdown = false
    private var retry: ScheduledFuture<*>? = null

    fun start(applicationId: String, title: String, state: String) {
        val parsedId = applicationId.trim().toLongOrNull()
        if (parsedId == null || parsedId <= 0L) {
            Log.w(TAG, "Discord presence skipped: DISCORD_APPLICATION_ID is not configured")
            clear()
            return
        }

        enqueue {
            if (isShutdown) return@enqueue
            retry?.cancel(false)
            retry = null

            if (this.applicationId != parsedId) {
                closeTransport()
            }
            this.applicationId = parsedId
            pendingFrame = setActivityFrame(title, state)
            publish()
        }
    }

    fun clear() {
        enqueue {
            retry?.cancel(false)
            retry = null
            val active = rpcConnection
            if (active != null && isAlive(active)) {
                runCatching { active.sendFrame(clearActivityFrame()) }
                    .onFailure { Log.d(TAG, "Discord presence clear failed", it) }
            }
            pendingFrame = null
            applicationId = null
            closeTransport()
        }
    }

    fun shutdown() {
        enqueue {
            if (!isShutdown) {
                retry?.cancel(false)
                retry = null
                val active = rpcConnection
                if (active != null && isAlive(active)) {
                    runCatching { active.sendFrame(clearActivityFrame()) }
                }
                pendingFrame = null
                applicationId = null
                closeTransport()
                isShutdown = true
            }
            worker.shutdown()
        }
    }

    private fun publish() {
        val frame = pendingFrame ?: return
        val appId = applicationId ?: return
        val active = rpcConnection
        if (active != null && isAlive(active)) {
            val sent = runCatching {
                active.sendFrame(frame)
                true
            }.onFailure { Log.w(TAG, "Discord RPC sendFrame failed", it) }
                .getOrDefault(false)
            if (sent) return
            closeTransport()
            scheduleRetry()
            return
        }

        if (active != null) closeTransport()
        if (isBound || isBinding) return

        val component = findRpcComponent()
        if (component == null) {
            Log.d(TAG, "Discord Android RPC service is unavailable")
            scheduleRetry()
            return
        }

        val connection = createServiceConnection(appId)
        serviceConnection = connection
        isBinding = true
        val intent = Intent(RPC_ACTION).setComponent(component)
        val bound = runCatching {
            appContext.bindService(intent, connection, Context.BIND_AUTO_CREATE)
        }.onFailure { Log.w(TAG, "Could not bind to Discord RPC service", it) }
            .getOrDefault(false)
        isBinding = false
        isBound = bound
        if (!bound) {
            serviceConnection = null
            scheduleRetry()
        }
    }

    private fun createServiceConnection(expectedApplicationId: Long) = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, binder: IBinder?) {
            enqueue {
                if (isShutdown || pendingFrame == null || applicationId != expectedApplicationId) {
                    closeTransport()
                    return@enqueue
                }
                if (binder == null) {
                    Log.w(TAG, "Discord RPC connected with a null binder")
                    closeTransport()
                    scheduleRetry()
                    return@enqueue
                }

                val callback = object : IDiscordRpcCallback.Stub() {
                    override fun onFrame(frame: String?) = Unit

                    override fun onClose(code: Int, message: String?) {
                        Log.d(TAG, "Discord RPC closed: $code ${message.orEmpty()}")
                        enqueue {
                            closeTransport()
                            if (pendingFrame != null) scheduleRetry()
                        }
                    }
                }

                val connection = runCatching {
                    IDiscordRpcService.Stub.asInterface(binder)
                        .connect(expectedApplicationId, RPC_VERSION, callback)
                }.onFailure { Log.w(TAG, "Discord RPC handshake failed", it) }
                    .getOrNull()

                if (connection == null) {
                    closeTransport()
                    scheduleRetry()
                    return@enqueue
                }

                rpcConnection = connection
                publish()
            }
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            enqueue {
                closeTransport()
                if (pendingFrame != null) scheduleRetry()
            }
        }

        override fun onBindingDied(name: ComponentName?) {
            enqueue {
                closeTransport()
                if (pendingFrame != null) scheduleRetry()
            }
        }

        override fun onNullBinding(name: ComponentName?) {
            enqueue {
                closeTransport()
                if (pendingFrame != null) scheduleRetry()
            }
        }
    }

    private fun findRpcComponent(): ComponentName? {
        val packageManager = appContext.packageManager
        for (discordPackage in DISCORD_PACKAGES) {
            val intent = Intent(RPC_ACTION).setPackage(discordPackage)
            val services = runCatching {
                if (Build.VERSION.SDK_INT >= 33) {
                    packageManager.queryIntentServices(
                        intent,
                        PackageManager.ResolveInfoFlags.of(PackageManager.MATCH_ALL.toLong()),
                    )
                } else {
                    @Suppress("DEPRECATION")
                    packageManager.queryIntentServices(intent, PackageManager.MATCH_ALL)
                }
            }.getOrElse { emptyList() }
            val info = services.firstOrNull { it.serviceInfo?.exported == true }?.serviceInfo
            if (info != null) return ComponentName(info.packageName, info.name)
        }
        return null
    }

    private fun closeTransport() {
        val active = rpcConnection
        rpcConnection = null
        if (active != null) {
            runCatching { active.disconnect() }
                .onFailure { Log.d(TAG, "Discord RPC disconnect ignored", it) }
        }

        val service = serviceConnection
        serviceConnection = null
        if (isBound && service != null) {
            runCatching { appContext.unbindService(service) }
                .onFailure { Log.d(TAG, "Discord RPC unbind ignored", it) }
        }
        isBound = false
        isBinding = false
    }

    private fun scheduleRetry() {
        if (isShutdown || pendingFrame == null || retry?.isDone == false) return
        retry = worker.schedule({
            retry = null
            publish()
        }, RETRY_DELAY_SECONDS, TimeUnit.SECONDS)
    }

    private fun isAlive(connection: IDiscordRpcConnection): Boolean =
        runCatching { connection.asBinder().isBinderAlive }.getOrDefault(false)

    private fun setActivityFrame(title: String, state: String): String {
        val activity = JSONObject()
            .put("type", ACTIVITY_WATCHING)
            .put("name", "AniFox")
            .put("details", truncate(title, MAX_FIELD_LENGTH))
            .put("state", truncate(state, MAX_FIELD_LENGTH))
            .put("timestamps", JSONObject().put("start", System.currentTimeMillis() / 1000L))
            .put("instance", true)
        return JSONObject()
            .put("cmd", "SET_ACTIVITY")
            .put("args", JSONObject().put("pid", Process.myPid()).put("activity", activity))
            .put("nonce", UUID.randomUUID().toString())
            .toString()
    }

    private fun clearActivityFrame(): String = JSONObject()
        .put("cmd", "SET_ACTIVITY")
        .put("args", JSONObject().put("pid", Process.myPid()).put("activity", JSONObject.NULL))
        .put("nonce", UUID.randomUUID().toString())
        .toString()

    private fun truncate(value: String, maxLength: Int): String =
        value.trim().take(maxLength)

    private fun enqueue(action: () -> Unit) {
        try {
            worker.execute(action)
        } catch (_: RejectedExecutionException) {
            // Activity teardown raced an optional presence callback.
        }
    }

    private companion object {
        const val TAG = "AniFoxDiscordRpc"
        const val RPC_ACTION = "com.discord.socialsdk.rpc.IDiscordRpcService"
        const val RPC_VERSION = "1"
        const val ACTIVITY_WATCHING = 3
        const val MAX_FIELD_LENGTH = 128
        const val RETRY_DELAY_SECONDS = 15L
        val DISCORD_PACKAGES = listOf(
            "com.discord",
            "com.discord.canary",
            "com.discord.ptb",
            "com.discord.debug",
        )
    }
}
