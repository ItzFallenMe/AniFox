package dev.itzfallenme.anifox

import io.flutter.embedding.engine.FlutterEngine
import io.flutter.embedding.android.FlutterFragmentActivity
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterFragmentActivity() {
    private var discordRpcClient: DiscordRpcClient? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        val client = DiscordRpcClient(applicationContext)
        discordRpcClient = client
        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            "dev.itzfallenme.anifox/discord_presence",
        ).setMethodCallHandler { call, result ->
            when (call.method) {
                "start" -> {
                    client.start(
                        applicationId = call.argument<String>("applicationId").orEmpty(),
                        title = call.argument<String>("title").orEmpty(),
                        state = call.argument<String>("state").orEmpty(),
                    )
                    result.success(null)
                }

                "clear" -> {
                    client.clear()
                    result.success(null)
                }

                else -> result.notImplemented()
            }
        }
    }

    override fun onDestroy() {
        discordRpcClient?.shutdown()
        discordRpcClient = null
        super.onDestroy()
    }
}
