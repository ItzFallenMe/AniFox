import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  CheckCircle2,
  DownloadCloud,
  Play,
  Trash2,
  WifiOff,
} from 'lucide-react-native';

import { useDownloads } from '../hooks/useDownloads';
import type { DownloadEntry } from '../services/downloads';
import { TMDBService } from '../services/tmdb';
import { colors, fonts, radius, spacing } from '../theme';
import { EmptyState, Kicker, Screen } from '../components/ui/Primitives';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATE_LABEL: Record<DownloadEntry['state'], string> = {
  queued: 'QUEUED',
  downloading: 'DOWNLOADING',
  stopped: 'PAUSED',
  completed: 'READY OFFLINE',
  failed: 'FAILED',
  removing: 'REMOVING',
  restarting: 'RETRYING',
};

const formatBytes = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '—';
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`;
};

/**
 * Offline library. Completed HLS downloads play from Media3's local cache in a
 * native player, so this list works with the radio off.
 */
export const DownloadsScreen = () => {
  const navigation = useNavigation<Nav>();
  const { entries, supported, remove, play } = useDownloads();
  const [busy, setBusy] = useState<string | null>(null);

  const onPlay = async (entry: DownloadEntry) => {
    setBusy(entry.id);
    await play(entry);
    setBusy(null);
  };

  const onRemove = async (id: string) => {
    setBusy(id);
    await remove(id);
    setBusy(null);
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={navigation.goBack}
          style={styles.circleButton}>
          <ArrowLeft color={colors.text} size={18} strokeWidth={2.2} />
        </Pressable>
        <View style={styles.headerText}>
          <Kicker>Watch offline</Kicker>
          <Text style={styles.title}>Downloads</Text>
        </View>
        <Text style={styles.count}>
          {entries.length} {entries.length === 1 ? 'TITLE' : 'TITLES'}
        </Text>
      </View>

      {!supported ? (
        <EmptyState
          title="Downloads are not available"
          message="This build does not include the offline downloader. Rebuild the Android app to enable it."
          icon={WifiOff}
        />
      ) : entries.length === 0 ? (
        <EmptyState
          title="Nothing downloaded"
          message="Play a film or episode, then tap Download in the player. Completed titles play without a connection."
          icon={DownloadCloud}
        />
      ) : (
        <View style={styles.list}>
          {entries.map(entry => (
            <DownloadRow
              key={entry.id}
              entry={entry}
              busy={busy === entry.id}
              onPlay={() => onPlay(entry)}
              onRemove={() => onRemove(entry.id)}
            />
          ))}
        </View>
      )}

      <Text style={styles.footnote}>
        Downloads are stored in the app&apos;s private storage and removed when
        you delete them or clear app data. Availability depends on the provider
        returning a downloadable stream.
      </Text>
    </Screen>
  );
};

const DownloadRow = ({
  entry,
  busy,
  onPlay,
  onRemove,
}: {
  entry: DownloadEntry;
  busy: boolean;
  onPlay: () => void;
  onRemove: () => void;
}) => {
  const poster = TMDBService.posterUrl(entry.item.poster_path, 'w185');
  const complete = entry.state === 'completed';
  const failed = entry.state === 'failed';

  return (
    <View style={styles.row}>
      <View style={styles.thumb}>
        {poster ? (
          <Image
            source={{ uri: poster }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : null}
      </View>

      <View style={styles.rowText}>
        <Text numberOfLines={1} style={styles.name}>
          {entry.title}
        </Text>
        <Text style={styles.meta}>
          {STATE_LABEL[entry.state]}
          {entry.contentLength > 0
            ? ` · ${formatBytes(entry.bytesDownloaded)} / ${formatBytes(
                entry.contentLength,
              )}`
            : ''}
        </Text>

        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              {
                width: `${Math.min(100, Math.max(0, entry.percent))}%`,
                backgroundColor: failed
                  ? colors.danger
                  : complete
                    ? colors.live
                    : colors.orange,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.actions}>
        {complete ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Play ${entry.title} offline`}
            disabled={busy}
            onPress={onPlay}
            style={({ pressed }) => [
              styles.round,
              styles.playRound,
              pressed && styles.pressed,
            ]}>
            {busy ? (
              <ActivityIndicator color={colors.onPrimary} size="small" />
            ) : (
              <Play
                color={colors.onPrimary}
                size={13}
                strokeWidth={0}
                fill={colors.onPrimary}
              />
            )}
          </Pressable>
        ) : (
          <View style={styles.round}>
            {entry.state === 'downloading' ? (
              <ActivityIndicator color={colors.orange} size="small" />
            ) : (
              <CheckCircle2 color={colors.textMuted} size={14} strokeWidth={2} />
            )}
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${entry.title}`}
          disabled={busy}
          onPress={onRemove}
          style={({ pressed }) => [styles.round, pressed && styles.pressed]}>
          <Trash2 color={colors.textMuted} size={14} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: 70 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  headerText: { flex: 1 },
  title: {
    fontFamily: fonts.displayBlack,
    fontSize: 32,
    letterSpacing: -1,
    color: colors.text,
    marginTop: 2,
  },
  circleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glass,
  },
  count: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.4,
    color: colors.textFaint,
  },
  list: { paddingHorizontal: spacing.xl, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    paddingRight: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  thumb: {
    width: 48,
    height: 68,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  rowText: { flex: 1 },
  name: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12.5,
    color: colors.text,
  },
  meta: {
    fontFamily: fonts.bodyBold,
    fontSize: 8.5,
    letterSpacing: 1,
    color: colors.textFaint,
    marginTop: 3,
  },
  track: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.surfaceRaised,
    marginTop: 8,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 2 },
  actions: { alignItems: 'center', gap: spacing.sm },
  round: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glass,
  },
  playRound: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  footnote: {
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 18,
    color: colors.textFaint,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  pressed: { opacity: 0.7 },
});
