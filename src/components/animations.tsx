import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

/**
 * Small animation primitives used across the app.
 *
 * `FadeInView` gives content a short rise-and-fade entrance, and
 * `PressableScale` adds a spring press-in scale to tappable surfaces. Both run
 * on the native driver so scrolling stays smooth.
 */

interface FadeInViewProps {
  children: ReactNode;
  /** Stagger delay in ms. */
  delay?: number;
  /** Vertical travel in dp; negative drops the content in from above. */
  offset?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

export const FadeInView = ({
  children,
  delay = 0,
  offset = 14,
  duration = 420,
  style,
}: FadeInViewProps) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [delay, duration, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [offset, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

interface PressableScaleProps extends PressableProps {
  children: ReactNode;
  /** Scale reached while the surface is held down. */
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
}

export const PressableScale = ({
  children,
  scaleTo = 0.96,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      damping: 16,
      stiffness: 260,
      mass: 0.6,
    }).start();
  };

  return (
    <Pressable
      {...rest}
      onPressIn={event => {
        animateTo(scaleTo);
        onPressIn?.(event);
      }}
      onPressOut={event => {
        animateTo(1);
        onPressOut?.(event);
      }}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </Pressable>
  );
};
