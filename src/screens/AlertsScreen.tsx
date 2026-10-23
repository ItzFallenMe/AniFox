import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Bell, BellOff } from 'lucide-react-native';

import { useEpisodeAlerts } from '../hooks/useLibrary';
import { disableEpisodeAlert, type EpisodeAlert } from '../services/episodeAlerts';
import { TMDBService } from '../services/tmdb';
import { colors, fonts, radius, spacing } from '../theme';
import { getTitle } from '../types';
import { formatAlertTime } from '../utils/format';
import type { RootStackParamList } from '../navigation/types';
import { EmptyState, Kicker, Screen } from '../components/ui/Primitives';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Scheduled per-series alerts. Cancelling drops both the Android alarm and the
 * stored entry, so the list always matches what will actually fire.
 */
export const AlertsScreen = () => {
  const navigation = useNavigation<Nav>();
  const { alerts } = useEpisodeAlerts();
  const [removing, setRemoving] = useState<number | null>(null);

  const cancel = useCallback(async (tvId: number) => {
    setRemoving(tvId);
    await disableEpisodeAlert(tvId);
    setRemoving(null);
  }, []);

  const sorted = [...alerts].sort((a, b) => a.scheduledAt - b.scheduledAt);

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
          <Kicker>Notifications</Kicker>
          <Text style={styles.title}>Episode alerts</Text>
        </View>
        <Text style={styles.count}>
          {sorted.length} {sorted.length === 1 ? 'ALERT' : 'ALERTS'}
        </Text>
      </View>

      {sorted.length === 0 ? (
        <EmptyState
          title="No alerts scheduled"
          message="Open a series and tap the bell next to its next episode to get a notification when it airs."
          icon={Bell}
        />
      ) : (
        <View style={styles.list}>
          {sorted.map(alert => (
            <AlertRow
              key={alert.tvId}
              alert={alert}
              removing={removing === alert.tvId}
              onOpen={() => navigation.navigate('Detail', { item: alert.item })}
              onCancel={() => cancel(alert.tvId)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
};

const AlertRow = ({
  alert,
  removing,
  onOpen,
  onCancel,
}: {
  alert: EpisodeAlert;
  removing: boolean;
  onOpen: () => void;
  onCancel: () => void;
}) => {
  const poster = TMDBService.posterUrl(alert.item.poster_path, 'w185');

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${getTitle(alert.item)}`}
        onPress={onOpen}
        style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}>
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
            {getTitle(alert.item)}
          </Text>
          <Text style={styles.episode}>
            S{alert.season} · E{alert.episode}
            {alert.episodeName ? ` — ${alert.episodeName}` : ''}
          </Text>
          <Text style={styles.when}>{formatAlertTime(alert.scheduledAt)}</Text>
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Cancel alert for ${getTitle(alert.item)}`}
        accessibilityState={{ disabled: removing }}
        disabled={removing}
        onPress={onCancel}
        style={({ pressed }) => [
          styles.cancel,
          pressed && styles.pressed,
          removing && styles.cancelBusy,
        ]}>
        <BellOff color={colors.textMuted} size={14} strokeWidth={2} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: 80 },
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
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    paddingRight: spacing.sm,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
  },
  thumb: {
    width: 44,
    height: 62,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  rowText: { flex: 1 },
  name: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.text,
  },
  episode: {
    fontFamily: fonts.body,
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  when: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 0.9,
    color: colors.textFaint,
    marginTop: 5,
  },
  cancel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glass,
  },
  cancelBusy: { opacity: 0.4 },
  pressed: { opacity: 0.72 },
});
