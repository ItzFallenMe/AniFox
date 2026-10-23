import { useEffect, useMemo, useRef, useState } from 'react';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@sbaiahmed1/react-native-blur';
import { Home, LayoutGrid, Search, Sparkles, User } from 'lucide-react-native';

import { glassPreset, useSettings } from '../hooks/useSettings';
import { colors, fonts, radius, spacing } from '../theme';

const ICONS = {
  Home,
  Browse: LayoutGrid,
  Anime: Sparkles,
  Search,
  User,
} as const;

const LABELS: Record<string, string> = {
  Home: 'Home',
  Browse: 'Browse',
  Anime: 'Anime',
  Search: 'Search',
  You: 'You',
};

const BAR_HEIGHT = 66;
const CAPSULE_INSET = 5;

/**
 * Floating pill tab bar with a liquid-glass treatment: a native blur layer,
 * a smoked tint, a specular top edge and a spring-animated capsule that
 * stretches slightly as it slides between tabs.
 *
 * Appearance is user-controlled from Settings (`liquidGlass`, `glassIntensity`
 * and `frostedBlur`); turning it off falls back to the original solid glass.
 */
export const TabBar = ({ state, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const [rowWidth, setRowWidth] = useState(0);

  const tabCount = state.routes.length;
  const tabWidth = rowWidth > 0 ? rowWidth / tabCount : 0;
  const preset = glassPreset(settings.glassIntensity);

  const position = useRef(new Animated.Value(state.index)).current;
  const stretch = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(position, {
      toValue: state.index,
      useNativeDriver: true,
      damping: 17,
      stiffness: 170,
      mass: 0.85,
    }).start();

    // A short horizontal stretch sells the "liquid" slide; it settles back
    // immediately rather than looping.
    stretch.setValue(1.07);
    Animated.spring(stretch, {
      toValue: 1,
      useNativeDriver: true,
      damping: 13,
      stiffness: 220,
      mass: 0.7,
    }).start();
  }, [state.index, position, stretch]);

  const translateX = useMemo(
    () => Animated.multiply(position, tabWidth),
    [position, tabWidth],
  );

  return (
    <View
      style={[
        styles.bar,
        { bottom: Math.max(insets.bottom, spacing.md) + 4 },
        settings.liquidGlass ? styles.barLiquid : styles.barSolid,
      ]}
    >
      {settings.liquidGlass && settings.frostedBlur ? (
        <BlurView
          blurType="dark"
          blurAmount={preset.blurAmount}
          blurRounds={22}
          overlayColor={preset.overlayColor}
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.blur]}
        />
      ) : null}

      {settings.liquidGlass ? (
        <>
          <LinearGradient
            colors={[
              'rgba(255,255,255,0.12)',
              'rgba(255,255,255,0.03)',
              'rgba(255,255,255,0)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />
          {/* Specular sheen along the top edge — the "wet" glass highlight. */}
          <LinearGradient
            colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            pointerEvents="none"
            style={styles.sheen}
          />
          <View pointerEvents="none" style={styles.rim} />
        </>
      ) : (
        <LinearGradient
          colors={[
            'rgba(255,255,255,0.09)',
            'rgba(255,255,255,0.015)',
            'rgba(255,255,255,0)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
        />
      )}

      <View
        style={styles.row}
        onLayout={event => setRowWidth(event.nativeEvent.layout.width)}
      >
        {settings.liquidGlass && rowWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.capsule,
              {
                width: Math.max(0, tabWidth - CAPSULE_INSET * 2),
                transform: [{ translateX }, { scaleX: stretch }],
              },
            ]}
          >
            <LinearGradient
              colors={[
                'rgba(255,255,255,0.26)',
                'rgba(255,255,255,0.10)',
                'rgba(255,255,255,0.05)',
              ]}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.capsuleRim} />
          </Animated.View>
        ) : null}

        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const Icon = ICONS[route.name as keyof typeof ICONS] ?? Home;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={LABELS[route.name] ?? route.name}
              onPress={onPress}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
            >
              <View
                style={[
                  styles.iconWrap,
                  focused && !settings.liquidGlass && styles.iconWrapActive,
                ]}
              >
                <Icon
                  color={focused ? colors.primary : colors.textFaint}
                  size={17}
                  strokeWidth={focused ? 2.4 : 2}
                />
              </View>
              <Text style={[styles.label, focused && styles.labelActive]}>
                {LABELS[route.name] ?? route.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    height: BAR_HEIGHT,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    shadowColor: '#000000',
    shadowOpacity: 0.55,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 16,
  },
  barLiquid: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderColor: 'rgba(255,255,255,0.16)',
  },
  barSolid: {
    // Sits underneath the blur so the bar stays legible if native blur is
    // unavailable, and gives the glass its dark smoke tint.
    backgroundColor: 'rgba(5,5,6,0.55)',
  },
  blur: { borderRadius: radius.lg - 1 },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '46%',
  },
  rim: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    borderRadius: radius.lg - 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  capsule: {
    position: 'absolute',
    top: CAPSULE_INSET,
    left: CAPSULE_INSET,
    height: BAR_HEIGHT - CAPSULE_INSET * 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#ffffff',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  capsuleRim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: '100%',
  },
  pressed: { opacity: 0.7 },
  iconWrap: {
    width: 34,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: colors.glassStrong },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 9,
    letterSpacing: 0.6,
    color: colors.textFaint,
  },
  labelActive: { color: colors.text, fontFamily: fonts.bodyBold },
});
