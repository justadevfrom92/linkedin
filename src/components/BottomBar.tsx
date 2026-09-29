import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { theme } from '../theme';

/** Height of the drawn shape: a thin strip that swells into a bump in the middle. */
const SHAPE_H = 52;
/** How thick the bar is at its thin outer edges. */
const EDGE_H = 16;
/** Half the width of the bump, from its center to where it meets the thin edge. */
const BUMP_HALF = 86;
const BUTTON = 44;

function shapePaths(width: number) {
  const cx = width / 2;
  const edgeTop = SHAPE_H - EDGE_H;
  const top = 1;
  // Two smooth curves rise from the thin edge to the top of the bump and back down.
  const outline =
    `M0,${edgeTop} L${cx - BUMP_HALF},${edgeTop} ` +
    `C${cx - BUMP_HALF * 0.5},${edgeTop} ${cx - BUMP_HALF * 0.55},${top} ${cx},${top} ` +
    `C${cx + BUMP_HALF * 0.55},${top} ${cx + BUMP_HALF * 0.5},${edgeTop} ${cx + BUMP_HALF},${edgeTop} ` +
    `L${width},${edgeTop}`;
  return { outline, fill: `${outline} L${width},${SHAPE_H} L0,${SHAPE_H} Z` };
}

export function BottomBar({ onAdd }: { onAdd: () => void }) {
  const [width, setWidth] = useState(0);
  const insets = useSafeAreaInsets();
  const paths = width ? shapePaths(width) : null;

  return (
    <View style={styles.wrap} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} pointerEvents="box-none">
      {paths && (
        <Svg width={width} height={SHAPE_H} style={styles.shape}>
          <Path d={paths.fill} fill={theme.card} />
          <Path d={paths.outline} fill="none" stroke={theme.border} strokeWidth={1} />
        </Svg>
      )}
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel="New prompt"
        hitSlop={10}
      >
        {/* Two bars instead of a "+" glyph, so the cross sits exactly in the middle. */}
        <View style={styles.plusH} />
        <View style={styles.plusV} />
      </Pressable>
      <View style={{ height: insets.bottom, backgroundColor: theme.card }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  shape: { marginBottom: -1 },
  button: {
    position: 'absolute',
    // Leaves an even ring of bar around the circle at the top of the bump.
    top: 6,
    alignSelf: 'center',
    width: BUTTON,
    height: BUTTON,
    borderRadius: BUTTON / 2,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.accent,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  pressed: { transform: [{ scale: 0.92 }] },
  plusH: { position: 'absolute', width: 18, height: 2.5, borderRadius: 1.25, backgroundColor: '#fff' },
  plusV: { position: 'absolute', width: 2.5, height: 18, borderRadius: 1.25, backgroundColor: '#fff' },
});

/** Space to leave under scrolling content so the last row clears the bar. */
export const BOTTOM_BAR_SPACE = SHAPE_H + 12;
