import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { AlertTriangle, Inbox, RotateCw } from 'lucide-react-native';

import { colors, fonts, glow, radius, spacing } from '../../theme';
import { DiagonalPattern } from '../DiagonalPattern';

type IconType = ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

/* ── Screen shell ────────────────────────────────────────────────────────── */

/**
 * Deep-black canvas: diagonal hairline texture, two soft ambient lights and a
 * single specular hairline along the top edge.
 */
export const ScreenBackground = () => (
  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <DiagonalPattern />
    <LinearGradient
      colors={['rgba(255,255,255,0.055)', 'rgba(255,255,255,0)']}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.auroraTop}
    />
    <LinearGradient
      colors={['rgba(255,255,255,0.025)', 'rgba(255,255,255,0)']}
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.auroraBottom}
    />
    <View style={styles.hairline} />
  </View>
);

export const Screen = ({
  children,
  style,
  scroll = false,
  contentStyle,
  edges = ['top'],
  refreshControl,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  refreshControl?: ReactElement;
}) => (
  <View style={[styles.screen, style]}>
    <ScreenBackground />
    <SafeAreaView edges={edges} style={styles.safeArea}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={contentStyle}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  </View>
);

/* ── Surfaces ────────────────────────────────────────────────────────────── */

export const GlassCard = ({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) => <View style={[styles.glassCard, style]}>{children}</View>;

export const Kicker = ({
  children,
  color = colors.textMuted,
  style,
}: {
  children: ReactNode;
  color?: string;
  style?: StyleProp<TextStyle>;
}) => <Text style={[styles.kicker, { color }, style]}>{children}</Text>;

/**
 * Section heading with the sarui-movies treatment: an icon tile, a title, a
 * one-line description and a hairline rule underneath.
 */
export const SectionHeader = ({
  kicker,
  title,
  description,
  icon: Icon,
  tone = colors.primary,
  action,
}: {
  kicker?: string;
  title: string;
  description?: string;
  icon?: IconType;
  tone?: string;
  action?: ReactNode;
}) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionHeaderText}>
      <View style={styles.sectionTitleRow}>
        {Icon ? (
          <View
            style={[
              styles.sectionIcon,
              { backgroundColor: `${tone}1F`, borderColor: `${tone}52` },
            ]}>
            <Icon color={tone} size={16} strokeWidth={2} />
          </View>
        ) : null}
        <View style={styles.sectionTitleText}>
          {kicker ? <Kicker>{kicker}</Kicker> : null}
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {action}
      </View>
      {description ? <Text style={styles.sectionDescription}>{description}</Text> : null}
    </View>
  </View>
);

/* ── Buttons ─────────────────────────────────────────────────────────────── */

export const PrimaryButton = ({
  label,
  onPress,
  icon: Icon,
  style,
  disabled,
}: {
  label: string;
  onPress?: () => void;
  icon?: IconType;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.primaryButton,
      glow,
      disabled && styles.disabled,
      pressed && styles.pressed,
      style,
    ]}>
    {Icon ? <Icon color={colors.onPrimary} size={18} strokeWidth={2.4} /> : null}
    <Text style={styles.primaryButtonText}>{label}</Text>
  </Pressable>
);

export const GhostButton = ({
  label,
  onPress,
  icon: Icon,
  style,
}: {
  label: string;
  onPress?: () => void;
  icon?: IconType;
  style?: StyleProp<ViewStyle>;
}) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={({ pressed }) => [styles.ghostButton, pressed && styles.pressed, style]}>
    {Icon ? <Icon color={colors.text} size={17} strokeWidth={2} /> : null}
    <Text style={styles.ghostButtonText}>{label}</Text>
  </Pressable>
);

export const IconButton = ({
  icon: Icon,
  onPress,
  size = 40,
  accessibilityLabel,
  style,
}: {
  icon: IconType;
  onPress?: () => void;
  size?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    onPress={onPress}
    hitSlop={8}
    style={({ pressed }) => [
      styles.iconButton,
      { width: size, height: size, borderRadius: size / 2 },
      pressed && styles.pressed,
      style,
    ]}>
    <Icon color={colors.text} size={18} strokeWidth={2.2} />
  </Pressable>
);

export const Chip = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.chip,
      active ? styles.chipActive : styles.chipIdle,
      pressed && styles.pressed,
    ]}>
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </Pressable>
);

/* ── Feedback ────────────────────────────────────────────────────────────── */

/**
 * Loading placeholder with sarui-movies' shimmer sweep: a soft highlight
 * travels across the surface instead of the whole block pulsing.
 */
export const Skeleton = ({
  width,
  height,
  style,
}: {
  width?: number | `${number}%`;
  height: number;
  style?: StyleProp<ViewStyle>;
}) => {
  const shimmer = useRef(new Animated.Value(0)).current;
  const [measuredWidth, setMeasuredWidth] = useState(0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  return (
    <View
      style={[styles.skeleton, { width: width ?? '100%', height }, style]}
      onLayout={event => setMeasuredWidth(event.nativeEvent.layout.width)}>
      {measuredWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [
                {
                  translateX: shimmer.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-measuredWidth, measuredWidth],
                  }),
                },
              ],
            },
          ]}>
          <LinearGradient
            colors={[
              'rgba(255,255,255,0)',
              'rgba(255,255,255,0.09)',
              'rgba(255,255,255,0)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}
    </View>
  );
};

export const ErrorState = ({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) => (
  <View style={styles.centerState}>
    <View style={styles.stateIcon}>
      <AlertTriangle color={colors.text} size={22} strokeWidth={1.8} />
    </View>
    <Text style={styles.stateTitle}>{title}</Text>
    <Text style={styles.stateMessage}>{message}</Text>
    {onRetry ? (
      <GhostButton label={retryLabel} icon={RotateCw} onPress={onRetry} style={styles.stateAction} />
    ) : null}
  </View>
);

export const EmptyState = ({
  title,
  message,
  icon: Icon = Inbox,
}: {
  title: string;
  message: string;
  icon?: IconType;
}) => (
  <View style={styles.centerState}>
    <View style={styles.stateIcon}>
      <Icon color={colors.textMuted} size={22} strokeWidth={1.8} />
    </View>
    <Text style={styles.stateTitle}>{title}</Text>
    <Text style={styles.stateMessage}>{message}</Text>
  </View>
);

/* ── Brand ───────────────────────────────────────────────────────────────── */

export const PulsingDot = ({ color = colors.primary }: { color?: string }) => {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.dotWrap}>
      <Animated.View
        style={[
          styles.dotRing,
          {
            backgroundColor: color,
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
            transform: [
              { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) },
            ],
          },
        ]}
      />
      <View style={[styles.dotCore, { backgroundColor: color }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  auroraTop: {
    position: 'absolute',
    top: -190,
    right: -160,
    width: 420,
    height: 420,
    borderRadius: 210,
  },
  auroraBottom: {
    position: 'absolute',
    bottom: -220,
    left: -170,
    width: 460,
    height: 460,
    borderRadius: 230,
  },
  hairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  glassCard: {
    backgroundColor: 'rgba(16, 16, 20, 0.92)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.xl,
    shadowColor: '#000000',
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },

  kicker: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  sectionHeaderText: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingBottom: spacing.md,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sectionTitleText: { flex: 1 },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 19,
    letterSpacing: -0.3,
    color: colors.text,
    marginTop: 2,
  },
  sectionDescription: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    lineHeight: 17,
    color: colors.textMuted,
    marginTop: 4,
  },

  primaryButton: {
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
  },
  primaryButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.onPrimary,
    letterSpacing: 0.2,
  },
  ghostButton: {
    height: 46,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(5, 5, 6, 0.55)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  ghostButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.text,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(5, 5, 6, 0.5)',
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.4 },

  chip: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  chipIdle: {
    borderColor: colors.border,
    backgroundColor: colors.glass,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    shadowColor: '#ffffff',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  chipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  chipTextActive: { color: colors.onPrimary, fontFamily: fonts.bodyBold },

  skeleton: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: 48,
  },
  stateIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  stateTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  stateMessage: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 320,
  },
  stateAction: { marginTop: spacing.xl },

  dotWrap: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotRing: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotCore: { width: 6, height: 6, borderRadius: 3 },
});
