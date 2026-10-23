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
        <Image
          source={require('../../assets/anifox-logo.png')}
          style={styles.logo}
          resizeMode="cover"
        />
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
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    marginBottom: spacing.xs,
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logoTile: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    // The mark is an orange fox on black, so it blends with the dark tile.
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: { width: 38, height: 38 },
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
