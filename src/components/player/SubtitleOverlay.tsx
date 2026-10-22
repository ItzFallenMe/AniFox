import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useSubtitleSettings } from '../../hooks/useSubtitleSettings';
import { fonts } from '../../theme';

interface SubtitleOverlayProps {
  text: string | null;
  /** Lift cues above the control bar when it is showing. */
  controlsVisible?: boolean;
  /** Device bottom inset, used when controls are hidden. */
  bottomInset?: number;
}

/**
 * Caption renderer, ported from Flickv4's `SubtitleOverlay`. Drawn in React
 * Native rather than as a native sidecar track so SRT from the catalogues can
 * be styled, offset and shown above the custom control bar.
 */
export const SubtitleOverlay = ({
  text,
  controlsVisible = false,
  bottomInset = 16,
}: SubtitleOverlayProps) => {
  const { settings } = useSubtitleSettings();

  const wrapStyle = useMemo(
    () => ({ bottom: controlsVisible ? 96 : bottomInset + 24 }),
    [controlsVisible, bottomInset],
  );
  const textStyle = useMemo(
    () => ({
      color: settings.textColor,
      fontSize: settings.fontSize,
      fontWeight: settings.bold ? ('700' as const) : ('400' as const),
    }),
    [settings.textColor, settings.fontSize, settings.bold],
  );

  if (!text) return null;

  const alpha = Math.round(Math.min(1, Math.max(0, settings.backgroundOpacity)) * 255)
    .toString(16)
    .padStart(2, '0');

  return (
    <View pointerEvents="none" style={[styles.wrap, wrapStyle]}>
      <View
        style={[
          styles.plate,
          settings.backgroundOpacity > 0
            ? { backgroundColor: `${settings.backgroundColor}${alpha}` }
            : null,
        ]}>
        <Text
          style={[
            styles.text,
            textStyle,
            settings.textShadow ? styles.shadow : null,
          ]}>
          {text}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  plate: {
    maxWidth: '100%',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: {
    fontFamily: fonts.bodyMedium,
    textAlign: 'center',
    lineHeight: 22,
  },
  shadow: {
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
