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
          <Image source={require('../../assets/anifox.png')} style={styles.logo} />
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
    width: 104,
    height: 104,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#ffffff',
    shadowOpacity: 0.25,
    shadowRadius: 34,
    elevation: 12,
  },
  logo: { width: 88, height: 88 },
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
