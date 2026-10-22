import type { ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { APP_INFO } from '../config/env';
import { colors, fonts, radius, spacing } from '../theme';

export const AppHeader = ({
  right,
  subtitle,
}: {
  right?: ReactNode;
  subtitle?: string;
}) => (
  <View style={styles.header}>
    <View style={styles.identity}>
      <View style={styles.logoTile}>
        <Image source={require('../../assets/anifox.png')} style={styles.logo} />
      </View>
      <View>
        <Text style={styles.wordmark}>{APP_INFO.name}</Text>
        <Text style={styles.subtitle}>{subtitle ?? 'Anime & movies'}</Text>
      </View>
    </View>
    {right}
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logoTile: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: { width: 34, height: 34 },
  wordmark: {
    fontFamily: fonts.displayBlack,
    fontSize: 21,
    letterSpacing: -0.7,
    color: colors.text,
    lineHeight: 24,
  },
  subtitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.textFaint,
  },
});
