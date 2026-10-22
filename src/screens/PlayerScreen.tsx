import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
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
  Captions,
  Check,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings2,
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
import type { SubtitleTrack } from '../services/subtitleService';
import { getTitle, type MediaItem } from '../types';
import { formatClock } from '../utils/format';
import { colors, fonts, radius, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import {
  WebViewScraper,
  type ExtractedStream,
} from '../components/WebViewScraper';
import { SubtitleOverlay } from '../components/player/SubtitleOverlay';
import { useSubtitles } from '../hooks/useSubtitles';
import { useSubtitleSettings } from '../hooks/useSubtitleSettings';
import { useSettings } from '../hooks/useSettings';
import {
  getPreferredServerId,
  mediaKeyFor,
  rememberWorkingServer,
} from '../services/serverPreference';
import {
  GhostButton,
  Kicker,
  PrimaryButton,
} from '../components/ui/Primitives';

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

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

const SEEK_STEP_SECONDS = 10;
const DOUBLE_TAP_MS = 320;
const SUBTITLE_OFFSET_STEP = 0.5;

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
  const { width: windowWidth } = useWindowDimensions();
  const { item, season, episode, episodeName } = route.params;

  const mediaType: 'movie' | 'tv' = item.media_type === 'tv' ? 'tv' : 'movie';
  const title = getTitle(item);

  const { settings } = useSettings();

  // One key per movie / episode: the server that worked for S1E1 of a show may
  // not carry S1E2, so preferences are never shared across episodes.
  const preferenceKey = mediaKeyFor(item.id, mediaType, season, episode);
  const [lastWorkingId, setLastWorkingId] = useState<string | null>(() =>
    getPreferredServerId(preferenceKey),
  );

  const [serverIndex, setServerIndex] = useState(() => {
    const targetId =
      getPreferredServerId(preferenceKey) ?? settings.defaultServerId;
    const preferred = PLAYBACK_SERVERS.findIndex(
      candidate => candidate.id === targetId,
    );
    return preferred >= 0 ? preferred : 0;
  });
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<Status>('scraping');
  const [source, setSource] = useState<PlayableSource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedServers, setFailedServers] = useState<string[]>([]);
  const [serverSheet, setServerSheet] = useState(false);
  const [settingsSheet, setSettingsSheet] = useState(false);
  const [subtitleSheet, setSubtitleSheet] = useState(false);

  const [playing, setPlaying] = useState(settings.autoPlay);
  const [buffering, setBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playableDuration, setPlayableDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [barWidth, setBarWidth] = useState(1);
  const [ended, setEnded] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(
    settings.defaultPlaybackRate,
  );
  const [seekFlash, setSeekFlash] = useState<'back' | 'forward' | null>(null);

  const videoRef = useRef<VideoRef>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sheetOpenRef = useRef(false);
  const lastTapRef = useRef(0);
  const controlsAnim = useRef(new Animated.Value(1)).current;

  const server = PLAYBACK_SERVERS[serverIndex];

  const { settings: subtitleSettings, setSettings: setSubtitleSettings } =
    useSubtitleSettings();

  const {
    tracks: subtitleTracks,
    selectedId: subtitleId,
    selectedTrack,
    selectTrack,
    cueAt,
    loading: subtitlesLoading,
    loadingCues,
    error: subtitlesError,
  } = useSubtitles({
    tmdbId: item.id,
    season,
    episode,
    enabled: status !== 'scraping',
    defaultLanguage: subtitleSettings.defaultLanguage,
  });

  // Session-only sync offset for the selected track; reset on track change.
  const [subtitleOffset, setSubtitleOffset] = useState(0);
  useEffect(() => {
    setSubtitleOffset(0);
  }, [subtitleId]);

  const subtitlesOpen = subtitleSheet || settingsSheet || serverSheet;
  useEffect(() => {
    sheetOpenRef.current = subtitlesOpen;
    if (subtitlesOpen) setControlsVisible(true);
  }, [subtitlesOpen]);

  useEffect(() => {
    StatusBar.setHidden(true);
    return () => StatusBar.setHidden(false);
  }, []);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    [],
  );

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!sheetOpenRef.current) setControlsVisible(false);
    }, 4200);
  }, []);

  const poke = useCallback(() => {
    setControlsVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  // Fade (and lift) the control HUD instead of snapping it in and out.
  useEffect(() => {
    Animated.timing(controlsAnim, {
      toValue: controlsVisible ? 1 : 0,
      duration: controlsVisible ? 180 : 240,
      useNativeDriver: true,
    }).start();
  }, [controlsVisible, controlsAnim]);

  const startServer = useCallback((index: number) => {
    setServerIndex(index);
    setSource(null);
    setStatus('scraping');
    setError(null);
    setAttempt(current => current + 1);
    setPlaying(true);
    setBuffering(true);
    setEnded(false);
    setPlayableDuration(0);
  }, []);

  const markFailed = useCallback((serverId: string) => {
    setFailedServers(current =>
      current.includes(serverId) ? current : [...current, serverId],
    );
  }, []);

  const handleExtracted = useCallback(
    (data: ExtractedStream) => {
      rememberWorkingServer(preferenceKey, server.id);
      setLastWorkingId(server.id);
      setSource({
        uri: data.videoUrl,
        type: sourceType(data.videoUrl),
        headers: playbackHeadersFor(server, data.pageUrl, data.cookies),
      });
      setStatus('ready');
      setBuffering(true);
      setPlaying(settings.autoPlay);
      scheduleHide();
    },
    [preferenceKey, scheduleHide, server, settings.autoPlay],
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

  const seekTo = useCallback(
    (seconds: number) => {
      const clamped = Math.max(0, Math.min(seconds, duration || seconds));
      videoRef.current?.seek(clamped);
      setCurrentTime(clamped);
      setEnded(false);
      poke();
    },
    [duration, poke],
  );

  const flashSeek = useCallback((direction: 'back' | 'forward') => {
    setSeekFlash(direction);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setSeekFlash(null), 550);
  }, []);

  const togglePlay = () => {
    if (ended) {
      seekTo(0);
      setPlaying(true);
      return;
    }
    setPlaying(value => !value);
    poke();
  };

  const onProgress = (data: OnProgressData) => {
    setCurrentTime(data.currentTime);
    if (typeof data.playableDuration === 'number') {
      setPlayableDuration(data.playableDuration);
    }
  };

  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;
  const buffered =
    duration > 0 && playableDuration > 0
      ? Math.min(playableDuration / duration, 1)
      : 0;

  const onBarPress = (locationX: number) => {
    if (duration <= 0) return;
    seekTo((locationX / barWidth) * duration);
  };

  const onBarLayout = (event: LayoutChangeEvent) => {
    setBarWidth(event.nativeEvent.layout.width || 1);
  };

  /** Single tap toggles the controls; a double tap on a side seeks. */
  const handleOverlayTap = (event: GestureResponderEvent) => {
    const x = event.nativeEvent.locationX;
    const now = Date.now();
    const isDoubleTap = now - lastTapRef.current < DOUBLE_TAP_MS;
    lastTapRef.current = now;

    if (isDoubleTap && x < windowWidth * 0.38) {
      seekTo(currentTime - SEEK_STEP_SECONDS);
      flashSeek('back');
      return;
    }
    if (isDoubleTap && x > windowWidth * 0.62) {
      seekTo(currentTime + SEEK_STEP_SECONDS);
      flashSeek('forward');
      return;
    }

    if (controlsVisible) setControlsVisible(false);
    else poke();
  };

  const activeCue = cueAt(currentTime - subtitleOffset);

  const subtitle =
    mediaType === 'tv' && season != null && episode != null
      ? `S${season} · E${episode}${episodeName ? ` — ${episodeName}` : ''}`
      : 'Movie';

  const closeSheets = () => {
    setServerSheet(false);
    setSettingsSheet(false);
    setSubtitleSheet(false);
  };

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
          source={{
            uri: source.uri,
            headers: source.headers,
            type: source.type,
          }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
          paused={!playing}
          rate={playbackRate}
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
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleOverlayTap}
          onLongPress={poke}
        >
          <SubtitleOverlay
            text={activeCue?.text ?? null}
            controlsVisible={controlsVisible}
            bottomInset={insets.bottom}
          />

          {seekFlash ? (
            <View
              pointerEvents="none"
              style={[
                styles.seekFlash,
                seekFlash === 'back'
                  ? styles.seekFlashLeft
                  : styles.seekFlashRight,
              ]}
            >
              <Text style={styles.seekFlashText}>
                {seekFlash === 'back' ? '−10s' : '+10s'}
              </Text>
            </View>
          ) : null}

          <Animated.View
            pointerEvents={controlsVisible ? 'box-none' : 'none'}
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: controlsAnim,
                transform: [
                  {
                    translateY: controlsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  },
                ],
              },
            ]}
          >
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
                style={styles.circleButton}
              >
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
                onPress={() => seekTo(currentTime - SEEK_STEP_SECONDS)}
                style={styles.skipButton}
              >
                <RotateCcw color={colors.text} size={24} strokeWidth={2} />
                <Text style={styles.skipLabel}>10</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={playing ? 'Pause' : 'Play'}
                onPress={togglePlay}
                style={styles.playCircle}
              >
                {playing ? (
                  <Pause
                    color={colors.onPrimary}
                    size={26}
                    strokeWidth={2.4}
                    fill={colors.onPrimary}
                  />
                ) : (
                  <Play
                    color={colors.onPrimary}
                    size={26}
                    strokeWidth={2.4}
                    fill={colors.onPrimary}
                  />
                )}
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Forward 10 seconds"
                onPress={() => seekTo(currentTime + SEEK_STEP_SECONDS)}
                style={styles.skipButton}
              >
                <SkipForward color={colors.text} size={24} strokeWidth={2} />
                <Text style={styles.skipLabel}>10</Text>
              </Pressable>
            </View>

            <View
              style={[
                styles.bottomBar,
                { paddingBottom: insets.bottom + spacing.lg },
              ]}
              pointerEvents="box-none"
            >
              <View style={styles.timeRow}>
                <Text style={styles.time}>{formatClock(currentTime)}</Text>
                <Text style={styles.time}>{formatClock(duration)}</Text>
              </View>

              <Pressable
                onLayout={onBarLayout}
                onPress={event => onBarPress(event.nativeEvent.locationX)}
                style={styles.progressTouch}
              >
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBuffered,
                      { width: `${buffered * 100}%` },
                    ]}
                  />
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${progress * 100}%` },
                    ]}
                  />
                  <View
                    style={[
                      styles.progressThumb,
                      { left: `${progress * 100}%` },
                    ]}
                  />
                </View>
              </Pressable>

              <View style={styles.bottomActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setServerSheet(true)}
                  style={styles.serverButton}
                >
                  <View style={styles.liveDot} />
                  <Text style={styles.serverButtonText}>{server.name}</Text>
                  <Text style={styles.serverButtonHint}>CHANGE</Text>
                </Pressable>

                <View style={styles.actionGroup}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Subtitles"
                    onPress={() => setSubtitleSheet(true)}
                    style={[
                      styles.circleButton,
                      subtitleId != null && styles.circleButtonActive,
                    ]}
                  >
                    <Captions color={colors.text} size={16} strokeWidth={2.2} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Playback settings"
                    onPress={() => setSettingsSheet(true)}
                    style={[
                      styles.circleButton,
                      playbackRate !== 1 && styles.circleButtonActive,
                    ]}
                  >
                    <Settings2
                      color={colors.text}
                      size={16}
                      strokeWidth={2.2}
                    />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Restart"
                    onPress={() => seekTo(0)}
                    style={styles.circleButton}
                  >
                    <SkipBack color={colors.text} size={16} strokeWidth={2.2} />
                  </Pressable>
                </View>
              </View>
            </View>
          </Animated.View>
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
          <PrimaryButton
            label="Watch again"
            icon={RotateCcw}
            onPress={() => seekTo(0)}
          />
          <GhostButton label="Back to details" onPress={navigation.goBack} />
        </View>
      ) : null}

      <ServerSheet
        visible={serverSheet}
        servers={PLAYBACK_SERVERS}
        activeId={server.id}
        lastWorkingId={lastWorkingId}
        failed={failedServers}
        onClose={closeSheets}
        onSelect={index => {
          closeSheets();
          startServer(index);
        }}
      />

      <SettingsSheet
        visible={settingsSheet}
        playbackRate={playbackRate}
        subtitleLabel={subtitleLabelFor(selectedTrack)}
        onClose={closeSheets}
        onSelectRate={rate => {
          setPlaybackRate(rate);
          closeSheets();
          poke();
        }}
        onOpenSubtitles={() => {
          setSettingsSheet(false);
          setSubtitleSheet(true);
        }}
      />

      <SubtitleSheet
        visible={subtitleSheet}
        tracks={subtitleTracks}
        selectedId={subtitleId}
        loading={subtitlesLoading}
        loadingCues={loadingCues}
        error={subtitlesError}
        offset={subtitleOffset}
        fontSize={subtitleSettings.fontSize}
        backgroundOpacity={subtitleSettings.backgroundOpacity}
        onClose={closeSheets}
        onSelect={id => {
          selectTrack(id);
          closeSheets();
          poke();
        }}
        onOffsetChange={delta =>
          setSubtitleOffset(current => Math.round((current + delta) * 10) / 10)
        }
        onFontSizeChange={delta =>
          setSubtitleSettings({
            fontSize: Math.min(
              28,
              Math.max(10, subtitleSettings.fontSize + delta),
            ),
          })
        }
        onBackgroundOpacityChange={delta =>
          setSubtitleSettings({
            backgroundOpacity:
              Math.round(
                Math.min(
                  1,
                  Math.max(0, subtitleSettings.backgroundOpacity + delta),
                ) * 100,
              ) / 100,
          })
        }
      />
    </View>
  );
};

const subtitleLabelFor = (track: SubtitleTrack | null): string => {
  if (!track) return 'Off';
  return `${track.display}${track.isHearingImpaired ? ' (CC)' : ''}`;
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
          style={styles.circleButton}
        >
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
        <GhostButton
          label="Change server"
          onPress={onChangeServer}
          style={styles.scrapeAction}
        />
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
          style={styles.circleButton}
        >
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

const SheetShell = ({
  visible,
  onClose,
  kicker,
  title,
  children,
  note,
}: {
  visible: boolean;
  onClose: () => void;
  kicker: string;
  title: string;
  children: ReactNode;
  note?: string;
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }]}
          onPress={() => {}}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Kicker>{kicker}</Kicker>
              <Text style={styles.sheetTitle}>{title}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close sheet"
              onPress={onClose}
              style={styles.circleButton}
            >
              <X color={colors.text} size={16} strokeWidth={2.2} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.sheetList}
          >
            {children}
          </ScrollView>

          {note ? <Text style={styles.sheetNote}>{note}</Text> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const ServerSheet = ({
  visible,
  servers,
  activeId,
  lastWorkingId,
  failed,
  onSelect,
  onClose,
}: {
  visible: boolean;
  servers: PlaybackServer[];
  activeId: string;
  lastWorkingId: string | null;
  failed: string[];
  onSelect: (index: number) => void;
  onClose: () => void;
}) => (
  <SheetShell
    visible={visible}
    onClose={onClose}
    kicker="Playback source"
    title="Choose a server"
    note="Streams come from third-party providers. If one fails, try another."
  >
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
          ]}
        >
          <View style={styles.serverRowText}>
            <Text style={styles.serverRowName}>{server.name}</Text>
            <Text style={styles.serverRowMeta}>
              {hasFailed ? 'Did not resolve · ' : ''}
              {server.id === lastWorkingId ? 'Worked last time · ' : ''}
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
  </SheetShell>
);

const SettingsSheet = ({
  visible,
  playbackRate,
  subtitleLabel,
  onSelectRate,
  onOpenSubtitles,
  onClose,
}: {
  visible: boolean;
  playbackRate: number;
  subtitleLabel: string;
  onSelectRate: (rate: number) => void;
  onOpenSubtitles: () => void;
  onClose: () => void;
}) => (
  <SheetShell
    visible={visible}
    onClose={onClose}
    kicker="Playback"
    title="Player settings"
  >
    <Text style={styles.groupLabel}>Speed</Text>
    <View style={styles.chipRow}>
      {PLAYBACK_SPEEDS.map(rate => (
        <Pressable
          key={rate}
          onPress={() => onSelectRate(rate)}
          style={[styles.chip, rate === playbackRate && styles.chipActive]}
        >
          <Text
            style={[
              styles.chipText,
              rate === playbackRate && styles.chipTextActive,
            ]}
          >
            {rate === 1 ? 'Normal' : `${rate}×`}
          </Text>
        </Pressable>
      ))}
    </View>

    <Text style={styles.groupLabel}>Captions</Text>
    <Pressable onPress={onOpenSubtitles} style={styles.settingRow}>
      <View style={styles.settingRowText}>
        <Text style={styles.settingRowTitle}>Subtitles</Text>
        <Text style={styles.settingRowMeta} numberOfLines={1}>
          {subtitleLabel}
        </Text>
      </View>
      <Text style={styles.settingRowAction}>MANAGE</Text>
    </Pressable>
  </SheetShell>
);

const SubtitleSheet = ({
  visible,
  tracks,
  selectedId,
  loading,
  loadingCues,
  error,
  offset,
  fontSize,
  backgroundOpacity,
  onSelect,
  onOffsetChange,
  onFontSizeChange,
  onBackgroundOpacityChange,
  onClose,
}: {
  visible: boolean;
  tracks: SubtitleTrack[];
  selectedId: string | null;
  loading: boolean;
  loadingCues: boolean;
  error: string | null;
  offset: number;
  fontSize: number;
  backgroundOpacity: number;
  onSelect: (id: string | null) => void;
  onOffsetChange: (delta: number) => void;
  onFontSizeChange: (delta: number) => void;
  onBackgroundOpacityChange: (delta: number) => void;
  onClose: () => void;
}) => (
  <SheetShell
    visible={visible}
    onClose={onClose}
    kicker="Accessibility"
    title="Subtitles"
    note="Tracks are searched across Vidrock and Wyzie."
  >
    <Pressable
      onPress={() => onSelect(null)}
      style={({ pressed }) => [
        styles.serverRow,
        pressed && styles.serverRowPressed,
      ]}
    >
      <View style={styles.serverRowText}>
        <Text style={styles.serverRowName}>Off</Text>
        <Text style={styles.serverRowMeta}>No captions</Text>
      </View>
      {selectedId == null ? (
        <Check color={colors.primary} size={16} strokeWidth={2.6} />
      ) : null}
    </Pressable>

    {loading ? (
      <View style={styles.sheetLoading}>
        <ActivityIndicator color={colors.primary} size="small" />
        <Text style={styles.sheetLoadingText}>Searching tracks…</Text>
      </View>
    ) : null}

    {!loading && error ? <Text style={styles.sheetNote}>{error}</Text> : null}

    {tracks.map(track => {
      const active = track.id === selectedId;
      return (
        <Pressable
          key={track.id}
          onPress={() => onSelect(track.id)}
          style={({ pressed }) => [
            styles.serverRow,
            active && styles.serverRowActive,
            pressed && styles.serverRowPressed,
          ]}
        >
          <View style={styles.serverRowText}>
            <Text style={styles.serverRowName}>
              {track.display}
              {track.isHearingImpaired ? ' (CC)' : ''}
            </Text>
            <Text style={styles.serverRowMeta}>
              {track.language.toUpperCase()} · {track.format.toUpperCase()} ·{' '}
              {track.source}
            </Text>
          </View>
          {active ? (
            <Check color={colors.primary} size={16} strokeWidth={2.6} />
          ) : null}
        </Pressable>
      );
    })}

    {loadingCues ? <Text style={styles.sheetNote}>Loading cues…</Text> : null}

    <Text style={styles.groupLabel}>Sync offset</Text>
    <View style={styles.stepperRow}>
      <Pressable
        onPress={() => onOffsetChange(-SUBTITLE_OFFSET_STEP)}
        style={styles.stepperButton}
      >
        <Minus color={colors.text} size={16} strokeWidth={2.4} />
      </Pressable>
      <Text style={styles.stepperValue}>{formatOffset(offset)}</Text>
      <Pressable
        onPress={() => onOffsetChange(SUBTITLE_OFFSET_STEP)}
        style={styles.stepperButton}
      >
        <Plus color={colors.text} size={16} strokeWidth={2.4} />
      </Pressable>
    </View>

    <Text style={styles.groupLabel}>Text size</Text>
    <View style={styles.stepperRow}>
      <Pressable
        onPress={() => onFontSizeChange(-1)}
        style={styles.stepperButton}
      >
        <Minus color={colors.text} size={16} strokeWidth={2.4} />
      </Pressable>
      <Text style={styles.stepperValue}>{Math.round(fontSize)}</Text>
      <Pressable
        onPress={() => onFontSizeChange(1)}
        style={styles.stepperButton}
      >
        <Plus color={colors.text} size={16} strokeWidth={2.4} />
      </Pressable>
    </View>

    <Text style={styles.groupLabel}>Background</Text>
    <View style={styles.stepperRow}>
      <Pressable
        onPress={() => onBackgroundOpacityChange(-0.1)}
        style={styles.stepperButton}
      >
        <Minus color={colors.text} size={16} strokeWidth={2.4} />
      </Pressable>
      <Text style={styles.stepperValue}>
        {Math.round(backgroundOpacity * 100)}%
      </Text>
      <Pressable
        onPress={() => onBackgroundOpacityChange(0.1)}
        style={styles.stepperButton}
      >
        <Plus color={colors.text} size={16} strokeWidth={2.4} />
      </Pressable>
    </View>
  </SheetShell>
);

const formatOffset = (seconds: number): string => {
  if (seconds === 0) return '0.0s';
  return `${seconds > 0 ? '+' : ''}${seconds.toFixed(1)}s`;
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
  circleButtonActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255,255,255,0.18)',
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
  seekFlash: {
    position: 'absolute',
    top: '42%',
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  seekFlashLeft: { left: 32 },
  seekFlashRight: { right: 32 },
  seekFlashText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.text,
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
  progressBuffered: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.32)',
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
  actionGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
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
  errorActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },

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
  sheetNote: {
    fontFamily: fonts.body,
    fontSize: 10,
    lineHeight: 16,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  sheetLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sheetLoadingText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
  },
  groupLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.8,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glass,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  chipTextActive: {
    fontFamily: fonts.bodyBold,
    color: colors.onPrimary,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glass,
  },
  settingRowText: { flex: 1 },
  settingRowTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.text,
  },
  settingRowMeta: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textFaint,
    marginTop: 2,
  },
  settingRowAction: {
    fontFamily: fonts.bodyBold,
    fontSize: 8,
    letterSpacing: 1.2,
    color: colors.textMuted,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  stepperButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glass,
  },
  stepperValue: {
    minWidth: 64,
    textAlign: 'center',
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.text,
  },
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
});
