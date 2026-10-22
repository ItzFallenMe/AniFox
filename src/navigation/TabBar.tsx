import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@sbaiahmed1/react-native-blur';
import { Home, Search, Sparkles, User } from 'lucide-react-native';

import { colors, fonts, radius, spacing } from '../theme';

const ICONS = {
  Home,
  Anime: Sparkles,
  Search,
  You: User,
} as const;

const LABELS: Record<string, string> = {
  Home: 'Home',
  Anime: 'Anime',
  Search: 'Search',
  You: 'You',
};

export const TabBar = ({ state, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        { bottom: Math.max(insets.bottom, spacing.md) + 4 },
      ]}>
      <BlurView
        blurType="dark"
        blurAmount={30}
        blurRounds={6}
        overlayColor="rgba(8,8,8,0.35)"
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.blur]}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.09)', 'rgba(255,255,255,0.015)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />

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
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
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
  );
};

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    height: 66,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    // Sits underneath the blur so the bar stays legible if native blur is
    // unavailable, and gives the glass its dark smoke tint.
    backgroundColor: 'rgba(10,10,10,0.45)',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    shadowColor: '#000000',
    shadowOpacity: 0.6,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  blur: { borderRadius: radius.lg - 1 },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
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
