import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowUpRight,
  ChevronRight,
  Database,
  Server,
  Settings2,
  ShieldCheck,
} from 'lucide-react-native';

import { APP_INFO, TMDB_CONFIG, isTmdbConfigured } from '../config/env';
import type { RootStackParamList } from '../navigation/types';
import { PLAYABLE_SERVERS } from '../config/embedServers';
import { colors, fonts, radius, spacing } from '../theme';
import { AppHeader } from '../components/AppHeader';
import { TmdbSetup } from '../components/TmdbSetup';
import {
  GlassCard,
  Kicker,
  Screen,
  SectionHeader,
} from '../components/ui/Primitives';

export const ProfileScreen = () => (
  <Screen scroll contentStyle={styles.content}>
    <AppHeader subtitle="Profile" />

    <View style={styles.pageHeader}>
      <Kicker>The project</Kicker>
      <Text style={styles.title}>You</Text>
      <Text style={styles.description}>
        A personal streaming client, built and maintained by {APP_INFO.creator}.
      </Text>
    </View>

    <View style={styles.section}>
      <GlassCard style={styles.brandCard}>
        <View style={styles.brandRow}>
          <View style={styles.logoTile}>
            <Image
              source={require('../../assets/anifox.png')}
              style={styles.logo}
            />
          </View>
          <View style={styles.brandText}>
            <Text style={styles.brandName}>{APP_INFO.name}</Text>
            <Text style={styles.brandTagline}>{APP_INFO.tagline}</Text>
          </View>
        </View>
        <View style={styles.brandMeta}>
          <Text style={styles.brandVersion}>VERSION {APP_INFO.version}</Text>
          <Text style={styles.brandVersion}>ANDROID</Text>
        </View>
      </GlassCard>
    </View>

    <SectionHeader kicker="Preferences" title="App settings" />
    <View style={styles.section}>
      <SettingsEntry />
    </View>

    <SectionHeader kicker="The creator" title="Behind AniFox" />
    <View style={styles.section}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Open ItzFallenMe on GitHub"
        onPress={() => Linking.openURL(APP_INFO.creatorUrl)}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <GlassCard style={styles.creatorCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>IF</Text>
          </View>
          <View style={styles.creatorText}>
            <Text style={styles.creatorName}>{APP_INFO.creator}</Text>
            <Text style={styles.creatorRole}>Creator & maintainer</Text>
          </View>
          <View style={styles.linkTile}>
            <ArrowUpRight color={colors.text} size={16} strokeWidth={2.2} />
          </View>
        </GlassCard>
      </Pressable>
      <Text style={styles.creatorNote}>
        Designed and developed with care. If AniFox made your evening better,
        say hi on GitHub.
      </Text>
    </View>

    <SectionHeader kicker="Playback" title="Streaming servers" />
    <View style={styles.section}>
      <GlassCard style={styles.listCard}>
        {PLAYABLE_SERVERS.map((server, index) => (
          <View
            key={server.id}
            style={[
              styles.serverRow,
              index < PLAYABLE_SERVERS.length - 1 && styles.rowDivider,
            ]}
          >
            <View style={styles.serverIcon}>
              <Server color={colors.textMuted} size={14} strokeWidth={2} />
            </View>
            <Text style={styles.serverName}>{server.label}</Text>
            <Text style={styles.serverIndex}>
              {String(index + 1).padStart(2, '0')}
            </Text>
          </View>
        ))}
      </GlassCard>
      <Text style={styles.finePrint}>
        Streams are resolved from third-party embed providers. AniFox stores no
        media and hosts nothing.
      </Text>
    </View>

    <SectionHeader kicker="Metadata" title="Data sources" />
    <View style={styles.section}>
      <GlassCard style={styles.sourceCard}>
        <View style={styles.sourceRow}>
          <View style={styles.sourceIcon}>
            <Database color={colors.text} size={16} strokeWidth={2} />
          </View>
          <View style={styles.sourceText}>
            <Text style={styles.sourceName}>TMDB</Text>
            <Text style={styles.sourceBody}>
              Titles, artwork and ratings come from The Movie Database.
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="link"
          onPress={() => Linking.openURL('https://www.themoviedb.org')}
          style={({ pressed }) => [
            styles.sourceLink,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.sourceLinkText}>themoviedb.org</Text>
          <ArrowUpRight color={colors.textMuted} size={14} strokeWidth={2} />
        </Pressable>
      </GlassCard>
    </View>

    {!isTmdbConfigured ? (
      <View style={styles.setupWrap}>
        <TmdbSetup />
      </View>
    ) : null}

    <View style={styles.section}>
      <GlassCard style={styles.legalCard}>
        <View style={styles.legalHeader}>
          <ShieldCheck color={colors.text} size={16} strokeWidth={2} />
          <Kicker>Disclaimer</Kicker>
        </View>
        <Text style={styles.legal}>
          {APP_INFO.name} does not host, upload or distribute any video content.
          All titles, artwork and trademarks belong to their respective owners.
          This app is a personal project and is not affiliated with any
          streaming service or with TMDB.
        </Text>
      </GlassCard>
    </View>

    <View style={styles.footer}>
      <Text style={styles.copyright}>
        © 2026 {APP_INFO.creator}. All rights reserved.
      </Text>
      <Text style={styles.buildNote}>
        {TMDB_CONFIG.API_KEY && isTmdbConfigured
          ? 'TMDB connected'
          : 'TMDB not configured'}
      </Text>
    </View>
  </Screen>
);

const SettingsEntry = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open settings"
      onPress={() => navigation.navigate('Settings')}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <GlassCard style={styles.settingsCard}>
        <View style={styles.sourceIcon}>
          <Settings2 color={colors.text} size={16} strokeWidth={2} />
        </View>
        <View style={styles.sourceText}>
          <Text style={styles.sourceName}>Settings</Text>
          <Text style={styles.sourceBody}>
            Liquid glass bar, default embed server and autoplay.
          </Text>
        </View>
        <ChevronRight color={colors.textMuted} size={16} strokeWidth={2} />
      </GlassCard>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: 140 },
  settingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  pageHeader: { paddingHorizontal: spacing.xl, marginBottom: spacing.xxl },
  title: {
    fontFamily: fonts.displayBlack,
    fontSize: 34,
    letterSpacing: -1.1,
    color: colors.text,
    marginTop: 2,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
    marginTop: spacing.xs,
    maxWidth: 330,
  },
  section: { paddingHorizontal: spacing.xl, marginBottom: spacing.xxl },
  setupWrap: { marginBottom: spacing.xxl },
  pressed: { opacity: 0.75 },

  brandCard: { padding: spacing.xxl },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  logoTile: {
    width: 58,
    height: 58,
    borderRadius: radius.md,
    // The mark ships on an opaque white square, so the tile stays white.
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: { width: 52, height: 52 },
  brandText: { flex: 1 },
  brandName: {
    fontFamily: fonts.displayBlack,
    fontSize: 26,
    letterSpacing: -0.9,
    color: colors.text,
  },
  brandTagline: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  brandMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  brandVersion: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.8,
    color: colors.textFaint,
  },

  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.displayBlack,
    fontSize: 18,
    color: colors.onPrimary,
    letterSpacing: -0.6,
  },
  creatorText: { flex: 1 },
  creatorName: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.text,
    letterSpacing: -0.3,
  },
  creatorRole: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  linkTile: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorNote: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 19,
    color: colors.textFaint,
    marginTop: spacing.md,
    paddingHorizontal: 2,
  },

  listCard: { padding: 0, overflow: 'hidden' },
  serverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  serverIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serverName: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.text,
  },
  serverIndex: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.4,
    color: colors.textFaint,
  },
  finePrint: {
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 18,
    color: colors.textFaint,
    marginTop: spacing.md,
  },

  sourceCard: { padding: spacing.lg },
  sourceRow: { flexDirection: 'row', gap: spacing.md },
  sourceIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceText: { flex: 1 },
  sourceName: {
    fontFamily: fonts.displayBold,
    fontSize: 16,
    color: colors.text,
  },
  sourceBody: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: 2,
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  sourceLinkText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textMuted,
  },

  legalCard: { padding: spacing.lg },
  legalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  legal: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    lineHeight: 19,
    color: colors.textMuted,
  },

  footer: { alignItems: 'center', gap: 4, paddingBottom: spacing.lg },
  copyright: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.textFaint,
  },
  buildNote: {
    fontFamily: fonts.body,
    fontSize: 9.5,
    color: colors.textFaint,
  },
});
