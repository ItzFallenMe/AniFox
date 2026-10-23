/**
 * Discord Rich Presence bridge.
 *
 * The Social SDK has a C++ API only (the AAR ships `libdiscord_partner_sdk.so`
 * and the `discordpp.h` bindings), so this file is the JNI seam behind
 * `com.itzfallenme.anifox.discord.sdk.DiscordSdkAdapterImpl`.
 *
 * On Android the SDK publishes presence over RPC to the installed Discord app:
 * no OAuth, no account link and no token. `Client::SetApplicationId` plus
 * `Client::UpdateRichPresence` is the whole flow — `Client::Connect` is only
 * needed for accounts, friends and voice, which AniFox does not use.
 *
 * All SDK work happens on one worker thread: it owns the client, drains tasks
 * posted from Java and pumps `discordpp::RunCallbacks()` so completion
 * callbacks are delivered.
 */

#include <jni.h>

#include <atomic>
#include <chrono>
#include <condition_variable>
#include <cstdint>
#include <deque>
#include <functional>
#include <memory>
#include <mutex>
#include <optional>
#include <string>
#include <thread>
#include <utility>

#include "discordpp.h"

namespace {

constexpr auto kPumpInterval = std::chrono::milliseconds(50);
constexpr int kMaxTextLength = 128;

std::mutex g_mutex;
std::condition_variable g_wakeup;
std::deque<std::function<void()>> g_tasks;
std::thread g_worker;
std::atomic<bool> g_running{false};
std::shared_ptr<discordpp::Client> g_client;

void drainTasks() {
  std::deque<std::function<void()>> tasks;
  {
    std::unique_lock<std::mutex> lock(g_mutex);
    g_wakeup.wait_for(lock, kPumpInterval, [] { return !g_tasks.empty(); });
    tasks.swap(g_tasks);
  }

  for (auto& task : tasks) {
    try {
      task();
    } catch (...) {
      // A failed presence update must never take the app down.
    }
  }

  try {
    discordpp::RunCallbacks();
  } catch (...) {
  }
}

void post(std::function<void()> task) {
  if (!g_running.load()) return;
  {
    std::lock_guard<std::mutex> lock(g_mutex);
    g_tasks.push_back(std::move(task));
  }
  g_wakeup.notify_one();
}

std::string toStdString(JNIEnv* env, jstring value) {
  if (value == nullptr) return {};
  const char* chars = env->GetStringUTFChars(value, nullptr);
  if (chars == nullptr) return {};
  std::string text(chars);
  env->ReleaseStringUTFChars(value, chars);
  return text;
}

/** Discord rejects empty or over-long fields, so trim them first. */
std::optional<std::string> presenceText(const std::string& value) {
  if (value.empty()) return std::nullopt;
  return value.size() > kMaxTextLength ? value.substr(0, kMaxTextLength) : value;
}

void ensureClient() {
  if (!g_client) {
    g_client = std::make_shared<discordpp::Client>();
  }
}

}  // namespace

extern "C" JNIEXPORT void JNICALL
Java_com_itzfallenme_anifox_discord_sdk_DiscordSdkAdapterImpl_nativeStart(JNIEnv*, jobject) {
  if (g_running.exchange(true)) return;
  g_worker = std::thread([] {
    while (g_running.load()) {
      drainTasks();
    }
  });
}

extern "C" JNIEXPORT void JNICALL
Java_com_itzfallenme_anifox_discord_sdk_DiscordSdkAdapterImpl_nativeSetApplicationId(
    JNIEnv*, jobject, jlong applicationId) {
  const auto id = static_cast<uint64_t>(applicationId);
  post([id] {
    ensureClient();
    g_client->SetApplicationId(id);
  });
}

extern "C" JNIEXPORT void JNICALL
Java_com_itzfallenme_anifox_discord_sdk_DiscordSdkAdapterImpl_nativeUpdatePresence(
    JNIEnv* env,
    jobject,
    jstring details,
    jstring state,
    jlong startSeconds,
    jstring largeImage,
    jstring largeText) {
  std::string detailsText = toStdString(env, details);
  std::string stateText = toStdString(env, state);
  std::string imageText = toStdString(env, largeImage);
  std::string imageLabel = toStdString(env, largeText);
  const auto startedAt = static_cast<uint64_t>(startSeconds);

  post([detailsText, stateText, imageText, imageLabel, startedAt] {
    ensureClient();

    discordpp::Activity activity;
    activity.SetType(discordpp::ActivityTypes::Playing);
    activity.SetDetails(presenceText(detailsText));
    activity.SetState(presenceText(stateText));

    if (startedAt > 0) {
      discordpp::ActivityTimestamps timestamps;
      timestamps.SetStart(startedAt);
      activity.SetTimestamps(timestamps);
    }

    const auto largeImage = presenceText(imageText);
    const auto largeLabel = presenceText(imageLabel);
    if (largeImage.has_value() || largeLabel.has_value()) {
      discordpp::ActivityAssets assets;
      if (largeImage.has_value()) assets.SetLargeImage(largeImage);
      if (largeLabel.has_value()) assets.SetLargeText(largeLabel);
      activity.SetAssets(assets);
    }

    g_client->UpdateRichPresence(std::move(activity), [](discordpp::ClientResult) {});
  });
}

extern "C" JNIEXPORT void JNICALL
Java_com_itzfallenme_anifox_discord_sdk_DiscordSdkAdapterImpl_nativeClearPresence(
    JNIEnv*, jobject) {
  post([] {
    if (g_client) g_client->ClearRichPresence();
  });
}
