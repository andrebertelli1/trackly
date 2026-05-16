import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, {
  Defs,
  Pattern,
  Rect,
  Circle,
  Path,
  G,
} from 'react-native-svg';
import { theme } from '../theme';
import { MAP_STOPS, ROUTE_PATH } from '../data';

const W = 374;

// Cubic bezier segments derived from ROUTE_PATH (M + C + S + S).
const SEGMENTS: [
  [number, number],
  [number, number],
  [number, number],
  [number, number],
][] = [
  [
    [30, 60],
    [110, 40],
    [150, 110],
    [230, 120],
  ],
  [
    [230, 120],
    [310, 130],
    [340, 200],
    [300, 260],
  ],
  [
    [300, 260],
    [260, 320],
    [110, 320],
    [60, 360],
  ],
];

function cubic(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number
) {
  const it = 1 - t;
  const x =
    it * it * it * p0[0] +
    3 * it * it * t * p1[0] +
    3 * it * t * t * p2[0] +
    t * t * t * p3[0];
  const y =
    it * it * it * p0[1] +
    3 * it * it * t * p1[1] +
    3 * it * t * t * p2[1] +
    t * t * t * p3[1];
  return { x, y };
}

// Precompute arc-length samples so progress is even along the path.
const SAMPLES: { x: number; y: number; cum: number }[] = (() => {
  const pts: { x: number; y: number; cum: number }[] = [];
  let cum = 0;
  let prev: { x: number; y: number } | null = null;
  for (const seg of SEGMENTS) {
    const [p0, p1, p2, p3] = seg;
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const p = cubic(p0, p1, p2, p3, t);
      if (prev) cum += Math.hypot(p.x - prev.x, p.y - prev.y);
      pts.push({ x: p.x, y: p.y, cum });
      prev = p;
    }
  }
  return pts;
})();

const TOTAL_LEN = SAMPLES[SAMPLES.length - 1]!.cum;

function pointAt(progress: number) {
  const target = Math.max(0, Math.min(1, progress)) * TOTAL_LEN;
  for (let i = 1; i < SAMPLES.length; i++) {
    const b = SAMPLES[i]!;
    if (b.cum >= target) {
      const a = SAMPLES[i - 1]!;
      const span = b.cum - a.cum || 1;
      const k = (target - a.cum) / span;
      const x = a.x + (b.x - a.x) * k;
      const y = a.y + (b.y - a.y) * k;
      const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      return { x, y, angle };
    }
  }
  const last = SAMPLES[SAMPLES.length - 1]!;
  return { x: last.x, y: last.y, angle: 0 };
}

type Props = { progress: number; height?: number };

export function MapView({ progress, height = 300 }: Props) {
  const van = useMemo(() => pointAt(progress), [progress]);
  const drawn = TOTAL_LEN * Math.max(0, Math.min(1, progress));
  const remaining = TOTAL_LEN - drawn;

  return (
    <View className="w-full overflow-hidden bg-map-bg" style={{ height }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="xMidYMid slice">
        <Defs>
          <Pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse">
            <Circle cx="1.5" cy="1.5" r="1" fill={theme.dot} />
          </Pattern>
        </Defs>
        <Rect width={W} height={height} fill="url(#dots)" />

        {/* neighborhood blocks */}
        <G opacity={0.7}>
          <Rect x={40} y={180} width={80} height={50} rx={10} fill={theme.block} />
          <Rect x={180} y={220} width={60} height={80} rx={10} fill={theme.block} />
          <Rect x={250} y={40} width={90} height={40} rx={10} fill={theme.block} />
          <Rect x={20} y={280} width={40} height={50} rx={10} fill={theme.block} />
          <Rect x={290} y={280} width={60} height={60} rx={10} fill={theme.block} />
        </G>

        {/* road shadow + road + dashed center */}
        <Path d={ROUTE_PATH} stroke={theme.roadShadow} strokeWidth={22} fill="none" strokeLinecap="round" />
        <Path d={ROUTE_PATH} stroke={theme.road} strokeWidth={18} fill="none" strokeLinecap="round" />
        <Path
          d={ROUTE_PATH}
          stroke="rgba(0,0,0,0.12)"
          strokeWidth={1.5}
          fill="none"
          strokeDasharray="6 6"
          strokeLinecap="round"
        />
        {/* progress overlay */}
        <Path
          d={ROUTE_PATH}
          stroke={theme.base}
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${drawn} ${remaining + 50}`}
          opacity={0.95}
        />

        {/* stops */}
        {MAP_STOPS.map((s, i) => (
          <G key={i} x={s.x} y={s.y}>
            <Circle r={9} fill={theme.surface} stroke={theme.lineStrong} strokeWidth={1.5} />
            <Circle
              r={3.2}
              fill={s.status === 'done' ? theme.success : s.status === 'now' ? theme.warm : theme.textFaint}
            />
          </G>
        ))}

        {/* school destination */}
        <G x={60} y={360}>
          <Rect x={-13} y={-13} width={26} height={26} rx={7} fill={theme.warm} />
          <Path d="M0 -6 L7 -1 V6 H-7 V-1 Z" fill="#fff" />
          <Rect x={-2} y={2} width={4} height={4} fill={theme.warm} />
        </G>

        {/* van */}
        <G x={van.x} y={van.y}>
          <Circle r={26} fill={theme.base} opacity={0.18} />
          <G rotation={van.angle}>
            <Rect x={-16} y={-11} width={32} height={22} rx={6} fill={theme.base} />
            <Rect x={-12} y={-7} width={9} height={7} rx={1.5} fill="#fff" opacity={0.95} />
            <Rect x={-1} y={-7} width={9} height={7} rx={1.5} fill="#fff" opacity={0.95} />
            <Circle cx={-9} cy={11} r={3.2} fill="#0E1116" />
            <Circle cx={9} cy={11} r={3.2} fill="#0E1116" />
            <Rect x={14} y={-3} width={3} height={4} rx={1} fill={theme.warm} />
          </G>
        </G>
      </Svg>
    </View>
  );
}
