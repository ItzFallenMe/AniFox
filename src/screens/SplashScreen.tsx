import { useEffect, useRef } from 'react';
import { Animated, Image, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { APP_INFO } from '../config/env';
import { colors, fonts, radius, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const SplashScreen = () => {
  const navigation = useNavigation<Nav>();
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 650,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => navigation.replace('Main'), 1500);
    return () => clearTimeout(timer);
  }, [fade, navigation, rise]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Animated.View
        style={[styles.content, { opacity: fade, transform: [{ translateY: rise }] }]}>
        <View style={styles.logoTile}>
          <Image
            source={require('../../assets/anifox-logo.png')}
            style={styles.logo}
            resizeMode="cover"
          />
        </View>

        <Text style={styles.title}>{APP_INFO.name}</Text>
        <Text style={styles.tagline}>{APP_INFO.tagline}</Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.divider} />
        <Text style={styles.credit}>CURATED BY {APP_INFO.creator.toUpperCase()}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { alignItems: 'center' },
  logoTile: {
    width: 112,
    height: 112,
    borderRadius: radius.xl,
    // The mark is an orange fox on black, so it blends with the dark tile.
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: colors.orange,
    shadowOpacity: 0.28,
    shadowRadius: 38,
    elevation: 12,
  },
  logo: { width: 112, height: 112 },
  title: {
    fontFamily: fonts.displayBlack,
    fontSize: 44,
    letterSpacing: -1.6,
    color: colors.text,
    marginTop: spacing.xxl,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 54,
    alignItems: 'center',
    gap: spacing.lg,
  },
  divider: {
    width: 36,
    height: 1,
    backgroundColor: colors.border,
  },
  credit: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 2.8,
    color: colors.textFaint,
  },
});
