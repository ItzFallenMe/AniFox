import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { DownloadCloud, Sparkles, X } from 'lucide-react-native';

import { useUpdate } from '../hooks/useUpdate';
import { colors, fonts, radius, spacing } from '../theme';
import { APP_VERSION } from '../services/updates';

/**
 * A single, dismissible line that points at the newest GitHub release. It is
 * the only update surface in the app: no Play Store, no background polling.
 */
export const UpdateBanner = () => {
  const { info, dismissed, dismiss } = useUpdate();

  if (!info || dismissed) return null;

  const open = () => {
    Linking.openURL(info.apkUrl ?? info.releaseUrl);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.icon}>
          <Sparkles color={colors.orange} size={16} strokeWidth={2} />
        </View>

        <View style={styles.text}>
          <Text style={styles.kicker}>UPDATE AVAILABLE</Text>
          <Text style={styles.title}>
            AniFox {info.version} <Text style={styles.current}>· you have {APP_VERSION}</Text>
          </Text>
          <Text numberOfLines={2} style={styles.body}>
            {info.notes.split('\n').find(line => line.trim().length > 0) ??
              'A newer build is ready to install.'}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Update to AniFox ${info.version}`}
          onPress={open}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <DownloadCloud color={colors.onPrimary} size={13} strokeWidth={2.4} />
          <Text style={styles.actionText}>Update</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss update"
          onPress={dismiss}
          hitSlop={10}
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
          <X color={colors.textMuted} size={13} strokeWidth={2.2} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.orangeBorder,
    backgroundColor: colors.orangeSoft,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.orangeBorder,
    backgroundColor: 'rgba(255,122,26,0.10)',
  },
  text: { flex: 1 },
  kicker: {
    fontFamily: fonts.bodyBold,
    fontSize: 7.5,
    letterSpacing: 1.4,
    color: colors.orange,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.text,
    marginTop: 1,
  },
  current: {
    fontFamily: fonts.body,
    color: colors.textFaint,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 10,
    lineHeight: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.orange,
  },
  actionText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9.5,
    color: colors.onPrimary,
  },
  close: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
});
