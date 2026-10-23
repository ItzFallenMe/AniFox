import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Check,
  Gamepad2,
  RotateCcw,
  Server,
  Sparkles,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { resetSettings, useSettings, type GlassIntensity } from '../hooks/useSettings';
import { EMBED_SERVERS, embedServerById } from '../config/embedServers';
import {
  connectDiscord,
  disconnectDiscord,
  discordConfigured,
  discordPresenceSupported,
  getDiscordStatus,
  type DiscordStatus,
} from '../services/discordPresence';
import { colors, fonts, radius, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import {
  GhostButton,
  GlassCard,
  Kicker,
  Screen,
  SectionHeader,
} from '../components/ui/Primitives';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const GLASS_LEVELS: { value: GlassIntensity; label: string }[] = [
  { value: 'soft', label: 'Soft' },
  { value: 'regular', label: 'Regular' },
  { value: 'strong', label: 'Strong' },
];

export const SettingsScreen = () => {
  const navigation = useNavigation<Nav>();
  const { settings, setSettings } = useSettings();
  const [serverSheet, setServerSheet] = useState(false);
  const [discordStatus, setDiscordStatus] = useState<DiscordStatus | null>(null);

  const defaultServerName = embedServerById(settings.defaultServerId).label;
  const discordReady =
    discordConfigured &&
    discordPresenceSupported &&
    Boolean(discordStatus?.sdkInstalled);

  useEffect(() => {
    getDiscordStatus().then(setDiscordStatus);
  }, []);

  const toggleDiscord = async (value: boolean) => {
    setSettings({ discordPresence: value });
    if (value) {
      setDiscordStatus(await connectDiscord());
    } else {
      await disconnectDiscord();
      setDiscordStatus(await getDiscordStatus());
    }
  };

  const discordSubtitle = !discordConfigured
    ? 'Add a Discord client ID in src/config/env.ts'
    : !discordPresenceSupported || !discordStatus?.sdkInstalled
      ? 'Discord SDK is not linked in this build'
      : discordStatus?.connected
        ? 'Live — your status shows what you are watching'
        : 'Show what you are watching on Discord';

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={navigation.goBack}
          style={styles.circleButton}
        >
          <ArrowLeft color={colors.text} size={18} strokeWidth={2.2} />
        </Pressable>
        <View style={styles.headerText}>
          <Kicker>Customise</Kicker>
          <Text style={styles.title}>Settings</Text>
        </View>
      </View>

      <SectionHeader kicker="Appearance" title="Liquid glass" />
      <View style={styles.section}>
        <GlassCard style={styles.card}>
          <ToggleRow
            icon={Sparkles}
            title="Liquid glass tab bar"
            subtitle="Blurred capsule bar with a sliding highlight"
            value={settings.liquidGlass}
            onChange={value => setSettings({ liquidGlass: value })}
          />
          <Divider />
          <View
            style={[styles.block, !settings.liquidGlass && styles.blockMuted]}
          >
            <Text style={styles.blockLabel}>Glass intensity</Text>
            <View style={styles.chipRow}>
              {GLASS_LEVELS.map(level => {
                const active = settings.glassIntensity === level.value;
                return (
                  <Pressable
                    key={level.value}
                    disabled={!settings.liquidGlass}
                    onPress={() => setSettings({ glassIntensity: level.value })}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {level.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Divider />
          <ToggleRow
            icon={Sparkles}
            title="Frosted blur"
            subtitle="Native backdrop blur behind the bar"
            value={settings.frostedBlur}
            disabled={!settings.liquidGlass}
            onChange={value => setSettings({ frostedBlur: value })}
          />
        </GlassCard>
      </View>

      <SectionHeader kicker="Playback" title="Player defaults" />
      <View style={styles.section}>
        <GlassCard style={styles.card}>
          <Pressable
            onPress={() => setServerSheet(true)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <View style={styles.rowIcon}>
              <Server color={colors.textMuted} size={15} strokeWidth={2} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Default server</Text>
              <Text style={styles.rowSubtitle} numberOfLines={1}>
                {defaultServerName}
              </Text>
            </View>
            <Text style={styles.rowAction}>CHANGE</Text>
          </Pressable>
          <Divider />
          <ToggleRow
            icon={Sparkles}
            title="Autoplay"
            subtitle="Start playing as soon as an embed provider is ready"
            value={settings.autoPlay}
            onChange={value => setSettings({ autoPlay: value })}
          />
        </GlassCard>
      </View>

      <SectionHeader kicker="Integrations" title="Discord" />
      <View style={styles.section}>
        <GlassCard style={styles.card}>
          <ToggleRow
            icon={Gamepad2}
            title="Rich Presence"
            subtitle={discordSubtitle}
            value={settings.discordPresence}
            disabled={!discordReady}
            onChange={toggleDiscord}
          />
        </GlassCard>
        <Text style={styles.finePrint}>
          Presence only publishes while the player is open. It needs a Discord
          application with the Social SDK enabled and the native SDK adapter
          linked into the Android build.
        </Text>
      </View>

      <View style={styles.section}>
        <GhostButton
          label="Reset all settings"
          icon={RotateCcw}
          onPress={() => {
            resetSettings();
          }}
        />
        <Text style={styles.finePrint}>
          Preferences are stored on this device and apply the next time a screen
          mounts.
        </Text>
      </View>

      <ServerPicker
        visible={serverSheet}
        activeId={settings.defaultServerId}
        onClose={() => setServerSheet(false)}
        onSelect={id => {
          setSettings({ defaultServerId: id });
          setServerSheet(false);
        }}
      />
    </Screen>
  );
};

const ToggleRow = ({
  icon: Icon,
  title,
  subtitle,
  value,
  onChange,
  disabled = false,
}: {
  icon: typeof Sparkles;
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) => (
  <View style={[styles.row, disabled && styles.blockMuted]}>
    <View style={styles.rowIcon}>
      <Icon color={colors.textMuted} size={15} strokeWidth={2} />
    </View>
    <View style={styles.rowText}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowSubtitle}>{subtitle}</Text>
    </View>
    <Switch
      accessibilityRole="switch"
      value={value}
      disabled={disabled}
      onValueChange={onChange}
      trackColor={{ false: colors.surfaceRaised, true: colors.primary }}
      thumbColor={value ? colors.onPrimary : colors.textMuted}
      ios_backgroundColor={colors.surfaceRaised}
    />
  </View>
);

const Divider = () => <View style={styles.divider} />;

const ServerPicker = ({
  visible,
  activeId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  activeId: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
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
              <Kicker>Playback</Kicker>
              <Text style={styles.sheetTitle}>Default server</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close server picker"
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
            <Pressable
              onPress={() => onSelect(null)}
              style={({ pressed }) => [
                styles.serverRow,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>First available</Text>
                <Text style={styles.rowSubtitle}>
                  Whichever server is listed first
                </Text>
              </View>
              {activeId == null ? (
                <Check color={colors.primary} size={16} strokeWidth={2.6} />
              ) : null}
            </Pressable>

            {EMBED_SERVERS.map((server, index) => {
              const active = server.id === activeId;
              return (
                <Pressable
                  key={server.id}
                  disabled={server.disabled}
                  onPress={() => onSelect(server.id)}
                  style={({ pressed }) => [
                    styles.serverRow,
                    active && styles.serverRowActive,
                    server.disabled && styles.blockMuted,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{server.label}</Text>
                    <Text style={styles.rowSubtitle} numberOfLines={1}>
                      {server.disabled
                        ? 'Unavailable'
                        : `Embed provider${server.note ? ` · ${server.note}` : ''}`}
                    </Text>
                  </View>
                  {active ? (
                    <Check color={colors.primary} size={16} strokeWidth={2.6} />
                  ) : (
                    <Text style={styles.serverIndex}>
                      {String(index + 1).padStart(2, '0')}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: 60 },
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
  section: { paddingHorizontal: spacing.xl, marginBottom: spacing.xxl },
  card: { padding: 0, overflow: 'hidden' },
  block: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  blockMuted: { opacity: 0.45 },
  blockLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.textFaint,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.text,
  },
  rowSubtitle: {
    fontFamily: fonts.body,
    fontSize: 10.5,
    color: colors.textFaint,
    marginTop: 2,
  },
  rowAction: {
    fontFamily: fonts.bodyBold,
    fontSize: 8,
    letterSpacing: 1.2,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginLeft: spacing.lg,
  },
  pressed: { opacity: 0.75 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    height: 32,
    paddingHorizontal: 13,
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
    fontSize: 11.5,
    color: colors.textSecondary,
  },
  chipTextActive: { fontFamily: fonts.bodyBold, color: colors.onPrimary },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepperButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glass,
  },
  stepperValue: {
    minWidth: 44,
    textAlign: 'center',
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.text,
  },
  finePrint: {
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 18,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing.md,
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
  sheetList: { maxHeight: 430 },
  serverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 11,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 4,
  },
  serverRowActive: {
    borderColor: colors.border,
    backgroundColor: colors.glass,
  },
  serverIndex: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.textFaint,
  },
});
