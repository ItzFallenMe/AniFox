import { Linking, StyleSheet, Text, View } from 'react-native';
import { ExternalLink, KeyRound } from 'lucide-react-native';

import { colors, fonts, radius, spacing } from '../theme';
import { GlassCard, Kicker, PrimaryButton } from './ui/Primitives';

export const TmdbSetup = () => (
  <View style={styles.wrap}>
    <GlassCard style={styles.card}>
      <View style={styles.iconTile}>
        <KeyRound color={colors.onPrimary} size={20} strokeWidth={2} />
      </View>

      <Kicker style={styles.kicker}>One-time setup</Kicker>
      <Text style={styles.title}>Connect TMDB</Text>
      <Text style={styles.body}>
        AniFox reads its whole catalog — anime, movies and series — from TMDB.
        Add a free API key once and everything lights up.
      </Text>

      <View style={styles.steps}>
        <Step index="01" text="Create a free TMDB account and request an API key." />
        <Step index="02" text="Paste it into src/config/env.ts as TMDB_API_KEY." />
        <Step index="03" text="Restart Metro. No native rebuild needed." />
      </View>

      <View style={styles.code}>
        <Text style={styles.codeLabel}>src/config/env.ts</Text>
        <Text style={styles.codeValue}>
          const TMDB_API_KEY = <Text style={styles.codeString}>'your_key'</Text>;
        </Text>
      </View>

      <PrimaryButton
        label="Get a free key"
        icon={ExternalLink}
        onPress={() => Linking.openURL('https://www.themoviedb.org/settings/api')}
        style={styles.button}
      />
    </GlassCard>
  </View>
);

const Step = ({ index, text }: { index: string; text: string }) => (
  <View style={styles.step}>
    <Text style={styles.stepIndex}>{index}</Text>
    <Text style={styles.stepText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  card: { padding: spacing.xxl },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  kicker: { marginBottom: spacing.xs },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 26,
    letterSpacing: -0.7,
    color: colors.text,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 21,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  steps: { marginTop: spacing.xl, gap: spacing.md },
  step: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  stepIndex: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.4,
    color: colors.textFaint,
    paddingTop: 3,
  },
  stepText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  code: {
    marginTop: spacing.xl,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: spacing.lg,
  },
  codeLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.textFaint,
    marginBottom: spacing.sm,
  },
  codeValue: { fontFamily: 'monospace', fontSize: 12, color: colors.textSecondary },
  codeString: { color: colors.text },
  button: { marginTop: spacing.xl },
});
