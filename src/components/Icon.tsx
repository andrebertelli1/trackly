import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

type IconName =
  | 'map'
  | 'route'
  | 'chat'
  | 'history'
  | 'user'
  | 'bell'
  | 'plus'
  | 'star'
  | 'phone'
  | 'play'
  | 'pause'
  | 'car'
  | 'check'
  | 'chevron'
  | 'chevron-left'
  | 'shield'
  | 'bolt'
  | 'menu'
  | 'pin';

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  filled?: boolean;
};

export function Icon({ name, size = 22, color = '#000', filled = false }: Props) {
  const sw = 1.8;
  const stroke = {
    stroke: color,
    strokeWidth: sw,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  const common = { width: size, height: size, viewBox: '0 0 24 24' };

  switch (name) {
    case 'map':
      return filled ? (
        <Svg {...common}>
          <Path fill={color} d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2Zm0 2.4 6 2v11.2l-6-2V5.4Z" />
        </Svg>
      ) : (
        <Svg {...common}>
          <Path {...stroke} d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2Z" />
          <Path {...stroke} d="M9 3v16M15 5v16" />
        </Svg>
      );
    case 'route':
      return (
        <Svg {...common}>
          <Circle cx={6} cy={6} r={2.5} {...stroke} />
          <Circle cx={18} cy={18} r={2.5} {...stroke} />
          <Path {...stroke} d="M8.5 6H14a4 4 0 0 1 0 8h-4a4 4 0 0 0 0 8h5.5" />
        </Svg>
      );
    case 'chat':
      return filled ? (
        <Svg {...common}>
          <Path
            fill={color}
            d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-6l-4 4v-4H6a2 2 0 0 1-2-2V5Z"
          />
        </Svg>
      ) : (
        <Svg {...common}>
          <Path
            {...stroke}
            d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-6l-4 4v-4H6a2 2 0 0 1-2-2V5Z"
          />
        </Svg>
      );
    case 'history':
      return (
        <Svg {...common}>
          <Circle cx={12} cy={12} r={9} {...stroke} />
          <Path {...stroke} d="M12 7v5l3 2" />
        </Svg>
      );
    case 'user':
      return (
        <Svg {...common}>
          <Circle cx={12} cy={8} r={4} {...stroke} />
          <Path {...stroke} d="M4 21a8 8 0 0 1 16 0" />
        </Svg>
      );
    case 'bell':
      return (
        <Svg {...common}>
          <Path {...stroke} d="M6 9a6 6 0 0 1 12 0v3l2 4H4l2-4V9Z" />
          <Path {...stroke} d="M10 20a2 2 0 0 0 4 0" />
        </Svg>
      );
    case 'plus':
      return (
        <Svg {...common}>
          <Path {...stroke} d="M12 5v14M5 12h14" />
        </Svg>
      );
    case 'star':
      return (
        <Svg {...common}>
          <Path fill={color} d="m12 3 2.6 5.6 6 .9-4.4 4.3 1.1 6.1L12 17l-5.4 2.9 1.1-6.1L3.3 9.5l6-.9L12 3Z" />
        </Svg>
      );
    case 'phone':
      return (
        <Svg {...common}>
          <Path
            fill={color}
            d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z"
          />
        </Svg>
      );
    case 'play':
      return (
        <Svg {...common}>
          <Path fill={color} stroke={color} strokeWidth={sw} strokeLinejoin="round" d="M7 4v16l13-8L7 4Z" />
        </Svg>
      );
    case 'pause':
      return (
        <Svg {...common}>
          <Rect x={6} y={4} width={4} height={16} rx={1} fill={color} />
          <Rect x={14} y={4} width={4} height={16} rx={1} fill={color} />
        </Svg>
      );
    case 'check':
      return (
        <Svg {...common}>
          <Path {...stroke} d="m5 12 5 5L20 7" />
        </Svg>
      );
    case 'chevron':
      return (
        <Svg {...common}>
          <Path {...stroke} d="m9 6 6 6-6 6" />
        </Svg>
      );
    case 'chevron-left':
      return (
        <Svg {...common}>
          <Path {...stroke} d="m15 6-6 6 6 6" />
        </Svg>
      );
    case 'shield':
      return (
        <Svg {...common}>
          <Path {...stroke} d="M12 3 5 5v6c0 5 3 8 7 10 4-2 7-5 7-10V5l-7-2Z" />
          <Path {...stroke} d="m9 12 2 2 4-4" />
        </Svg>
      );
    case 'menu':
      return (
        <Svg {...common}>
          <Circle cx={6} cy={12} r={1.6} fill={color} />
          <Circle cx={12} cy={12} r={1.6} fill={color} />
          <Circle cx={18} cy={12} r={1.6} fill={color} />
        </Svg>
      );
    case 'bolt':
      return (
        <Svg {...common}>
          <Path fill={color} d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
        </Svg>
      );
    case 'car':
      return (
        <Svg {...common}>
          <Path
            {...stroke}
            d="M5 14h14l-1.5-5a3 3 0 0 0-2.9-2.1H9.4A3 3 0 0 0 6.5 9L5 14ZM4 18v-4h16v4h-2v-1H6v1H4Z"
          />
          <Circle cx={8} cy={17} r={1.2} fill={color} />
          <Circle cx={16} cy={17} r={1.2} fill={color} />
        </Svg>
      );
    case 'pin':
      return filled ? (
        <Svg {...common}>
          <Path fill={color} d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7Z" />
          <Circle cx={12} cy={9} r={2.5} fill="#fff" />
        </Svg>
      ) : (
        <Svg {...common}>
          <Path {...stroke} d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7Z" />
          <Circle cx={12} cy={9} r={2.5} {...stroke} />
        </Svg>
      );
  }
}
