import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Video, {
  type OnLoadData,
  type OnProgressData,
  type VideoRef,
} from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import {
  ArrowLeft,
  Check,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  TriangleAlert,
  X,
} from 'lucide-react-native';

import {
  PLAYBACK_SERVERS,
  playbackHeadersFor,
  type PlaybackServer,
} from '../services/servers';
import { getTitle, type MediaItem } from '../types';
import { formatClock } from '../utils/format';
import { colors, fonts, radius, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import { WebViewScraper, type ExtractedStream } from '../components/WebViewScraper';
import { GhostButton, Kicker, PrimaryButton } from '../components/ui/Primitives';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = {
  params: {
    item: MediaItem;
    season?: number;
    episode?: number;
    episodeName?: string;
  };
};

type Status = 'scraping' | 'ready' | 'error';

interface PlayableSource {
  uri: string;
  type?: string;
  headers: Record<string, string>;
}

const sourceType = (uri: string): string | undefined => {
  if (uri.includes('.m3u8')) return 'm3u8';
  if (uri.includes('.mpd')) return 'mpd';
  if (uri.includes('.mp4')) return 'mp4';
  return undefined;
};

export const PlayerScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute() as Route;
  const insets = useSafeAreaInsets();
  const { item, season, episode, episodeName } = route.params;

  const mediaType: 'movie' | 'tv' = item.media_type === 'tv' ? 'tv' : 'movie';
  const title = getTitle(item);

  const [serverIndex, setServerIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<Status>('scraping');
  const [source, setSource] = useState<PlayableSource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedServers, setFailedServers] = useState<string[]>([]);
  const [serverSheet, setServerSheet] = useState(false);

  const [playing, setPlaying] = useState(true);
  const [buffering, setBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [barWidth, setBarWidth] = useState(1);
  const [ended, setEnded] = useState(false);

  const videoRef = useRef<VideoRef>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const server = PLAYBACK_SERVERS[serverIndex];

  useEffect(() => {
    StatusBar.setHidden(true);
    return () => StatusBar.setHidden(false);
  }, []);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 4200);
  }, []);

  const poke = useCallback(() => {
    setControlsVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  const startServer = useCallback((index: number) => {
    setServerIndex(index);
    setSource(null);
    setStatus('scraping');
    setError(null);
    setAttempt(current => current + 1);
    setPlaying(true);
    setBuffering(true);
    setEnded(false);
  }, []);

  const markFailed = useCallback((serverId: string) => {
    setFailedServers(current =>
      current.includes(serverId) ? current : [...current, serverId],
    );
  }, []);

  const handleExtracted = useCallback(
    (data: ExtractedStream) => {
      setSource({
        uri: data.videoUrl,
        type: sourceType(data.videoUrl),
        headers: playbackHeadersFor(server, data.pageUrl, data.cookies),
      });
      setStatus('ready');
      setBuffering(true);
      setPlaying(true);
      scheduleHide();
    },
    [scheduleHide, server],
  );

  const handleScrapeError = useCallback(
    (message: string) => {
      markFailed(server.id);
      setError(message);
      setStatus('error');
    },
    [markFailed, server.id],
  );

  const tryNextServer = useCallback(() => {
    const failed = [...failedServers, server.id];
    setFailedServers(failed);
    const next = PLAYBACK_SERVERS.findIndex(
      candidate => !failed.includes(candidate.id),
    );
    if (next >= 0) {
      startServer(next);
      return;
    }
    setError('Every server failed for this title. Try again in a moment.');
    setStatus('error');
    setSource(null);
  }, [failedServers, server.id, startServer]);

  const handleVideoError = useCallback(() => {
    tryNextServer();
  }, [tryNextServer]);

  const seekTo = (seconds: number) => {
    const clamped = Math.max(0, Math.min(seconds, duration || seconds));
    videoRef.current?.seek(clamped);
    setCurrentTime(clamped);
    setEnded(false);
    poke();
  };

  const togglePlay = () => {
    if (ended) {
      seekTo(0);
      setPlaying(true);
      poke();
      return;
    }
    setPlaying(value => !value);
    poke();
  };

  const onProgress = (data: OnProgressData) => {
    setCurrentTime(data.currentTime);
  };

  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  const onBarPress = (locationX: number) => {
    if (duration <= 0) return;
    seekTo((locationX / barWidth) * duration);
  };

  const onBarLayout = (event: LayoutChangeEvent) => {
    setBarWidth(event.nativeEvent.layout.width || 1);
  };

  const subtitle =
    mediaType === 'tv' && season != null && episode != null
      ? `S${season} · E${episode}${episodeName ? ` — ${episodeName}` : ''}`
      : 'Movie';

  return (
    <View style={styles.container}>
      {status === 'scraping' ? (
        <WebViewScraper
          key={`${server.id}-${attempt}`}
          server={server}
          tmdbId={item.id}
          type={mediaType}
          season={season}
          episode={episode}
          title={title}
          timeoutSeconds={server.scraperTimeoutSeconds}
          onDataExtracted={handleExtracted}
          onError={handleScrapeError}
        />
      ) : null}

      {status === 'ready' && source ? (
        <Video
          ref={videoRef}
          source={{ uri: source.uri, headers: source.headers, type: source.type }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
          paused={!playing}
          controls={false}
          onLoad={(data: OnLoadData) => {
            setDuration(data.duration);
            setBuffering(false);
          }}
          onProgress={onProgress}
          onBuffer={data => setBuffering(data.isBuffering)}
          onEnd={() => {
            setEnded(true);
            setPlaying(false);
            setControlsVisible(true);
          }}
          onError={handleVideoError}
          progressUpdateInterval={250}
          preventsDisplaySleepDuringVideoPlayback
        />
      ) : null}

      {status === 'scraping' ? (
        <ScrapingState
          title={title}
          server={server}
          onCancel={navigation.goBack}
          onChangeServer={() => setServerSheet(true)}
        />
      ) : null}

      {status === 'error' ? (
        <ErrorOverlay
          message={error ?? 'No stream found.'}
          onRetry={() => startServer(serverIndex)}
          onChangeServer={() => setServerSheet(true)}
          onBack={navigation.goBack}
        />
      ) : null}

      {status === 'ready' ? (
        <Pressable style={StyleSheet.absoluteFill} onPress={poke}>
          {controlsVisible ? (
            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
              <LinearGradient
                colors={['rgba(0,0,0,0.82)', 'rgba(0,0,0,0)']}
                pointerEvents="none"
                style={[styles.topGradient, { paddingTop: insets.top + 8 }]}
              />

              <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close player"
                  onPress={navigation.goBack}
                  style={styles.circleButton}>
                  <ArrowLeft color={colors.text} size={18} strokeWidth={2.2} />
                </Pressable>
                <View style={styles.topTitleWrap}>
                  <Text numberOfLines={1} style={styles.topTitle}>
                    {title}
                  </Text>
                  <Text style={styles.topSubtitle}>{subtitle}</Text>
                </View>
                <View style={styles.livePill}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>{server.name.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.centerControls} pointerEvents="box-none">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back 10 seconds"
                  onPress={() => seekTo(currentTime - 10)}
                  style={styles.skipButton}>
                  <RotateCcw color={colors.text} size={24} strokeWidth={2} />
                  <Text style={styles.skipLabel}>10</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={playing ? 'Pause' : 'Play'}
                  onPress={togglePlay}
                  style={styles.playCircle}>
                  {playing ? (
                    <Pause color={colors.onPrimary} size={26} strokeWidth={2.4} fill={colors.onPrimary} />
                  ) : (
                    <Play color={colors.onPrimary} size={26} strokeWidth={2.4} fill={colors.onPrimary} />
                  )}
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Forward 10 seconds"
                  onPress={() => seekTo(currentTime + 10)}
                  style={styles.skipButton}>
                  <SkipForward color={colors.text} size={24} strokeWidth={2} />
                  <Text style={styles.skipLabel}>10</Text>
                </Pressable>
              </View>

              <View
                style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.lg }]}
                pointerEvents="box-none">
                <View style={styles.timeRow}>
                  <Text style={styles.time}>{formatClock(currentTime)}</Text>
                  <Text style={styles.time}>{formatClock(duration)}</Text>
                </View>

                <Pressable
                  onLayout={onBarLayout}
                  onPress={event => onBarPress(event.nativeEvent.locationX)}
                  style={styles.progressTouch}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                    <View style={[styles.progressThumb, { left: `${progress * 100}%` }]} />
                  </View>
                </Pressable>

                <View style={styles.bottomActions}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setServerSheet(true)}
                    style={styles.serverButton}>
                    <View style={styles.liveDot} />
                    <Text style={styles.serverButtonText}>{server.name}</Text>
                    <Text style={styles.serverButtonHint}>CHANGE</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Restart"
                    onPress={() => seekTo(0)}
                    style={styles.circleButton}>
                    <SkipBack color={colors.text} size={16} strokeWidth={2.2} />
                  </Pressable>
                </View>
              </View>
            </View>
          ) : null}
        </Pressable>
      ) : null}

      {buffering && status === 'ready' ? (
        <View style={styles.bufferOverlay} pointerEvents="none">
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      ) : null}

      {ended ? (
        <View style={styles.endedOverlay}>
          <Text style={styles.endedTitle}>Finished</Text>
          <Text style={styles.endedMessage}>{title}</Text>
          <PrimaryButton label="Watch again" icon={RotateCcw} onPress={() => seekTo(0)} />
          <GhostButton label="Back to details" onPress={navigation.goBack} />
        </View>
      ) : null}

      <ServerSheet
        visible={serverSheet}
        servers={PLAYBACK_SERVERS}
        activeId={server.id}
        failed={failedServers}
        onClose={() => setServerSheet(false)}
        onSelect={index => {
          setServerSheet(false);
          startServer(index);
        }}
      />
    </View>
  );
};

const ScrapingState = ({
  title,
  server,
  onCancel,
  onChangeServer,
}: {
  title: string;
  server: PlaybackServer;
  onCancel: () => void;
  onChangeServer: () => void;
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.overlay, { paddingTop: insets.top + 8 }]}>
      <View style={styles.overlayTop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          onPress={onCancel}
          style={styles.circleButton}>
          <X color={colors.text} size={18} strokeWidth={2.2} />
        </Pressable>
        <Kicker>Resolving stream</Kicker>
      </View>

      <View style={styles.scrapeCenter}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.scrapeTitle}>Finding a stream</Text>
        <Text style={styles.scrapeTitleMuted} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.scrapeBody}>
          {server.name} is warming up. This can take a few seconds.
        </Text>
        <GhostButton label="Change server" onPress={onChangeServer} style={styles.scrapeAction} />
      </View>
    </View>
  );
};

const ErrorOverlay = ({
  message,
  onRetry,
  onChangeServer,
  onBack,
}: {
  message: string;
  onRetry: () => void;
  onChangeServer: () => void;
  onBack: () => void;
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.overlay, { paddingTop: insets.top + 8 }]}>
      <View style={styles.overlayTop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          style={styles.circleButton}>
          <ArrowLeft color={colors.text} size={18} strokeWidth={2.2} />
        </Pressable>
      </View>

      <View style={styles.scrapeCenter}>
        <View style={styles.errorTile}>
          <TriangleAlert color={colors.text} size={24} strokeWidth={1.8} />
        </View>
        <Text style={styles.scrapeTitle}>No stream found</Text>
        <Text style={styles.scrapeBody}>{message}</Text>
        <View style={styles.errorActions}>
          <PrimaryButton label="Try again" icon={RotateCcw} onPress={onRetry} />
          <GhostButton label="All servers" onPress={onChangeServer} />
        </View>
      </View>
    </View>
  );
};

const ServerSheet = ({
  visible,
  servers,
  activeId,
  failed,
  onSelect,
  onClose,
}: {
  visible: boolean;
  servers: PlaybackServer[];
  activeId: string;
  failed: string[];
  onSelect: (index: number) => void;
  onClose: () => void;
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }]}
          onPress={() => {}}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Kicker>Playback source</Kicker>
              <Text style={styles.sheetTitle}>Choose a server</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close server list"
              onPress={onClose}
              style={styles.circleButton}>
              <X color={colors.text} size={16} strokeWidth={2.2} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.sheetList}>
            {servers.map((server, index) => {
              const active = server.id === activeId;
              const hasFailed = failed.includes(server.id);
              return (
                <Pressable
                  key={server.id}
                  onPress={() => onSelect(index)}
                  style={({ pressed }) => [
                    styles.serverRow,
                    active && styles.serverRowActive,
                    pressed && styles.serverRowPressed,
                  ]}>
                  <View style={styles.serverRowText}>
                    <Text style={styles.serverRowName}>{server.name}</Text>
                    <Text style={styles.serverRowMeta}>
                      {hasFailed ? 'Did not resolve · ' : ''}
                      {server.scraperTimeoutSeconds ?? 60}s timeout
                    </Text>
                  </View>
                  {active ? (
                    <Check color={colors.primary} size={16} strokeWidth={2.6} />
                  ) : (
                    <Text style={styles.serverRowIndex}>
                      {String(index + 1).padStart(2, '0')}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.sheetNote}>
            Streams come from third-party providers. If one fails, try another.
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  circleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  topTitleWrap: { flex: 1 },
  topTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 14,
    color: colors.text,
  },
  topSubtitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 26,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  liveText: {
    fontFamily: fonts.bodyBold,
    fontSize: 8,
    letterSpacing: 1.2,
    color: colors.text,
  },
  centerControls: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    marginTop: -40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 34,
  },
  skipButton: { alignItems: 'center', gap: 2 },
  skipLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 8,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  playCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ffffff',
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 8,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
  },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  time: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  progressTouch: { height: 24, justifyContent: 'center' },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  progressThumb: {
    position: 'absolute',
    top: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: -5,
    backgroundColor: colors.primary,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  serverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  serverButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.text,
  },
  serverButtonHint: {
    fontFamily: fonts.bodyBold,
    fontSize: 7,
    letterSpacing: 1.2,
    color: colors.textFaint,
  },
  bufferOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  endedTitle: {
    fontFamily: fonts.displayBlack,
    fontSize: 30,
    letterSpacing: -0.8,
    color: colors.text,
  },
  endedMessage: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.md,
    textAlign: 'center',
  },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xxl,
  },
  overlayTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  scrapeCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  scrapeTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    letterSpacing: -0.5,
    color: colors.text,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  scrapeTitleMuted: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scrapeBody: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    lineHeight: 18,
    color: colors.textFaint,
    textAlign: 'center',
    maxWidth: 280,
    marginTop: spacing.xs,
  },
  scrapeAction: { marginTop: spacing.lg },
  errorTile: {
    width: 58,
    height: 58,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },

  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#080808',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.xl,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.text,
    marginTop: 2,
  },
  sheetList: { maxHeight: 380 },
  serverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 4,
  },
  serverRowActive: {
    borderColor: colors.border,
    backgroundColor: colors.glass,
  },
  serverRowPressed: { backgroundColor: colors.glassStrong },
  serverRowText: { flex: 1 },
  serverRowName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.text,
  },
  serverRowMeta: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textFaint,
    marginTop: 2,
  },
  serverRowIndex: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.textFaint,
  },
  sheetNote: {
    fontFamily: fonts.body,
    fontSize: 10,
    lineHeight: 16,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
