import Svg, { Path } from 'react-native-svg';

// Outline icons drawn as SVG so they look the same on every platform.

type IconProps = { color: string; size?: number };

function Icon({ d, color, size = 18 }: IconProps & { d: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={d} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Icon
      {...props}
      d="M4 7h16M10 11v6M14 11v6M5.5 7l1 12.2A2 2 0 0 0 8.5 21h7a2 2 0 0 0 2-1.8L18.5 7M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"
    />
  );
}

export function HomeIcon(props: IconProps) {
  return <Icon {...props} d="M3.5 10.5 12 3.5l8.5 7M6 9v10.5a1 1 0 0 0 1 1h3.5V15h3v5.5H17a1 1 0 0 0 1-1V9" />;
}
