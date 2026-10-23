import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import {
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  SkipForward,
} from 'lucide-react-native';

import {
  EMBED_SERVERS,
  PLAYABLE_SERVERS,
  embedServerById,
  type StreamContext,
} from '../config/embedServers';
import { useSettings } from '../hooks/useSettings';
import { getTitle, isMovie, type MediaItem } from '../types';
import { AD_BLOCK_SCRIPT, isBlockedScheme, shouldBlockNavigation } from '../utils/adBlock';
import { colors, fonts, radius, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import { GhostButton, GlassCard, IconButton, Kicker } from '../components/ui/Primitives';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = {
  params: {
    item: MediaItem;
    season?: number;
    episode?: number;
    episodeName?: string;
  };
};

/** Keep the provider's own autoplay flag in sync with the app setting. */
const withAutoplay = (link: string, enabled: boolean): string => {
  if (!enabled) {
    return link.replace(/([?&])autoplay=[^&]*&?/i, '$1').replace(/[?&]$/, '');
  }
  if (/[?&]autoplay=/i.test(link)) {
    return link.replace(/autoplay=[^&]*/i, 'autoplay=1');
  }
  return `${link}${link.includes('?') ? '&' : '?'}autoplay=1`;
};

export const PlayerScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute() as Route;
  const { item, season, episode, episodeName } = route.params;
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const movie = isMovie(item);
  const title = getTitle(item);

  const context = useMemo<StreamContext>(
    () => ({
      isSeries: !movie,
      tmdbId: String(item.id),
      season: movie ? undefined : String(season ?? 1),
      episode: movie ? undefined : (episode ?? 1),
      title,
    }),
    [episode, item.id, movie, season, title],
  );

  const [serverId, setServerId] = useState(
    () => embedServerById(settings.defaultServerId).id,
  );
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [adFree, setAdFree] = useState(true);

  const server = embedServerById(serverId);
  const url = useMemo(
    () => withAutoplay(server.getUrl(context), settings.autoPlay),
    [context, server, settings.autoPlay],
  );

  const reload = () => {
    setFailed(false);
    setLoading(true);
    setReloadKey(current => current + 1);
  };

  const selectServer = (id: string) => {
    setServerId(id);
    reload();
  };

  const nextServer = () => {
    const index = PLAYABLE_SERVERS.findIndex(entry => entry.id === server.id);
    const next = PLAYABLE_SERVERS[(index + 1) % PLAYABLE_SERVERS.length];
    selectServer(next.id);
  };

  const onShouldStartLoadWithRequest = (request: ShouldStartLoadRequest) => {
    if (!adFree) return !isBlockedScheme(request.url);
    return !shouldBlockNavigation(
      request.url,
      url,
      request.isTopFrame ?? false,
    );
  };

  const subtitle = movie
    ? 'Now watching'
    : [`Season ${context.season}`, `Episode ${context.episode}`, episodeName]
        .filter(Boolean)
        .join(' · ');

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.safe, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.header}>
          <IconButton
            icon={ArrowLeft}
            accessibilityLabel="Back"
            onPress={navigation.goBack}
          />
          <View style={styles.headerText}>
            <Text numberOfLines={1} style={styles.title}>
              {title}
            </Text>
            <Text numberOfLines={1} style={styles.subtitle}>
              {subtitle}
            </Text>
          </View>
          <View style={[styles.guard, adFree ? styles.guardOn : styles.guardOff]}>
            {adFree ? (
              <ShieldCheck color={colors.live} size={12} strokeWidth={2.2} />
            ) : (
              <ShieldOff color={colors.textMuted} size={12} strokeWidth={2.2} />
            )}
            <Text
              style={[
                styles.guardText,
                adFree ? styles.guardTextOn : styles.guardTextOff,
              ]}>
              AD-FREE
            </Text>
          </View>
        </View>

        <View style={[styles.stage, { height: Math.round((width * 9) / 16) }]}>
          <WebView
            key={`${server.id}-${reloadKey}-${adFree ? 'guard' : 'plain'}`}
            source={{ uri: url }}
            style={styles.web}
            javaScriptEnabled
            domStorageEnabled
            thirdPartyCookiesEnabled
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback
            allowsFullscreenVideo
            mixedContentMode="always"
            setSupportMultipleWindows={false}
            originWhitelist={['*']}
            injectedJavaScriptBeforeContentLoaded={adFree ? AD_BLOCK_SCRIPT : undefined}
            onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
            onLoadStart={() => {
              setLoading(true);
              setFailed(false);
            }}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setFailed(true);
            }}
            onHttpError={() => {
              setLoading(false);
              setFailed(true);
            }}
          />

          {loading && !failed ? (
            <View pointerEvents="none" style={styles.overlay}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.overlayText}>Resolving {server.label}…</Text>
            </View>
          ) : null}

          {failed ? (
            <View style={styles.overlay}>
              <Text style={styles.errorTitle}>Video cannot be displayed</Text>
              <Text style={styles.errorBody}>
                {server.label} did not respond. Reload, or pick another provider.
              </Text>
              <View style={styles.errorActions}>
                <GhostButton label="Try again" icon={RefreshCw} onPress={reload} />
                <GhostButton label="Next server" icon={SkipForward} onPress={nextServer} />
              </View>
            </View>
          ) : null}
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
          showsVerticalScrollIndicator={false}>
          <GlassCard style={styles.panel}>
            <View style={styles.panelRow}>
              <Kicker>Server</Kicker>

              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: adFree }}
                accessibilityLabel="Ad-free mode"
                onPress={() => {
                  setAdFree(value => !value);
                  reload();
                }}
                style={[styles.toggle, adFree && styles.toggleOn]}>
                {adFree ? (
                  <ShieldCheck color={colors.live} size={13} strokeWidth={2.2} />
                ) : (
                  <ShieldOff color={colors.textMuted} size={13} strokeWidth={2.2} />
                )}
                <Text style={[styles.toggleText, adFree && styles.toggleTextOn]}>
                  Ad-free {adFree ? 'on' : 'off'}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Reload video"
                onPress={reload}
                style={({ pressed }) => [styles.reload, pressed && styles.pressed]}>
                <RefreshCw color={colors.textSecondary} size={15} strokeWidth={2.2} />
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.serverRow}>
              {EMBED_SERVERS.map(entry => {
                const active = entry.id === server.id;
                return (
                  <Pressable
                    key={entry.id}
                    disabled={entry.disabled}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active, disabled: entry.disabled }}
                    accessibilityLabel={entry.label}
                    onPress={() => selectServer(entry.id)}
                    style={[
                      styles.serverChip,
                      active && styles.serverChipActive,
                      entry.disabled && styles.serverChipDisabled,
                    ]}>
                    <Text
                      style={[
                        styles.serverText,
                        active && styles.serverTextActive,
                      ]}>
                      {entry.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.note}>
              {server.note ??
                'Streams come from third-party embed providers. AniFox hosts nothing.'}
            </Text>
          </GlassCard>

          <View style={styles.actions}>
            <GhostButton
              label={movie ? 'More details' : 'Episodes'}
              onPress={navigation.goBack}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next server"
              onPress={nextServer}
              style={({ pressed }) => [styles.nextButton, pressed && styles.pressed]}>
              <SkipForward color={colors.onPrimary} size={15} strokeWidth={2.4} />
              <Text style={styles.nextText}>Next server</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  headerText: { flex: 1 },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 17,
    letterSpacing: -0.3,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  guard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 7,
    borderWidth: 1,
  },
  guardOn: { backgroundColor: colors.liveSoft, borderColor: colors.liveBorder },
  guardOff: { backgroundColor: colors.glass, borderColor: colors.border },
  guardText: {
    fontFamily: fonts.bodyBold,
    fontSize: 8,
    letterSpacing: 1,
  },
  guardTextOn: { color: colors.live },
  guardTextOff: { color: colors.textMuted },

  stage: {
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderSubtle,
  },
  web: { flex: 1, backgroundColor: '#000000' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    backgroundColor: 'rgba(7,7,7,0.94)',
  },
  overlayText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textMuted,
  },
  errorTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  errorBody: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 300,
  },
  errorActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },

  footer: { padding: spacing.xl, gap: spacing.md },
  panel: { padding: spacing.lg, gap: spacing.md },
  panelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 28,
    paddingHorizontal: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glass,
  },
  toggleOn: {
    backgroundColor: colors.liveSoft,
    borderColor: colors.liveBorder,
  },
  toggleText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: colors.textMuted,
  },
  toggleTextOn: { color: colors.live },
  reload: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serverRow: { gap: spacing.sm, paddingVertical: 2 },
  serverChip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    justifyContent: 'center',
  },
  serverChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  serverChipDisabled: { opacity: 0.3 },
  serverText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11.5,
    color: colors.textSecondary,
  },
  serverTextActive: { color: colors.onPrimary, fontFamily: fonts.bodyBold },
  note: {
    fontFamily: fonts.body,
    fontSize: 10.5,
    lineHeight: 16,
    color: colors.textFaint,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 46,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    flex: 1,
  },
  nextText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.onPrimary,
  },
  pressed: { opacity: 0.75 },
});
