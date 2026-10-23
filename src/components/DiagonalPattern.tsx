import { StyleSheet } from 'react-native';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';

/**
 * The faint diagonal hairline texture from the reference: 1px white lines at
 * ~2% opacity, rotated 45°, tiled across the canvas. Vector, so it costs one
 * draw call and scales to any screen height.
 */
export const DiagonalPattern = ({ opacity = 0.022 }: { opacity?: number }) => (
  <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
    <Defs>
      <Pattern
        id="anifox-diagonal"
        width={22}
        height={22}
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)">
        <Line
          x1={0}
          y1={0}
          x2={0}
          y2={22}
          stroke="#ffffff"
          strokeWidth={1}
          opacity={opacity}
        />
      </Pattern>
    </Defs>
    <Rect width="100%" height="100%" fill="url(#anifox-diagonal)" />
  </Svg>
);
