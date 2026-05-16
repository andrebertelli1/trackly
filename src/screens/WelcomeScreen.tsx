import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Svg, { Defs, Pattern, Rect, Circle, Path, G } from 'react-native-svg';
import { theme } from '../theme';

type Props = { onContinue: () => void; onInviteCode: () => void };

export function WelcomeScreen({ onContinue, onInviteCode }: Props) {
  return (
    <View className="flex-1 bg-canvas px-6 pt-3 pb-7">
      <View className="flex-1 rounded-3xl overflow-hidden min-h-[260px]" style={{ backgroundColor: '#EDEAE1' }}>
        <Svg width="100%" height="100%" viewBox="0 0 320 320" preserveAspectRatio="xMidYMid slice">
          <Defs>
            <Pattern id="wdots" width="14" height="14" patternUnits="userSpaceOnUse">
              <Circle cx={1} cy={1} r={0.8} fill={theme.dot} />
            </Pattern>
          </Defs>
          <Rect width={320} height={320} fill="url(#wdots)" />
          <Path
            d="M -20 220 C 80 160, 160 260, 260 190 S 380 240, 360 280"
            stroke={theme.road}
            strokeWidth={34}
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d="M -20 220 C 80 160, 160 260, 260 190"
            stroke={theme.base}
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
          />
          <G x={180} y={200} rotation={-12}>
            <Rect x={-44} y={-30} width={88} height={58} rx={14} fill={theme.base} />
            <Rect x={-34} y={-20} width={22} height={18} rx={3} fill="#fff" opacity={0.95} />
            <Rect x={-8} y={-20} width={22} height={18} rx={3} fill="#fff" opacity={0.95} />
            <Rect x={18} y={-20} width={22} height={18} rx={3} fill="#fff" opacity={0.95} />
            <Circle cx={-26} cy={28} r={8} fill="#0E1116" />
            <Circle cx={26} cy={28} r={8} fill="#0E1116" />
            <Rect x={40} y={-10} width={6} height={10} rx={2} fill={theme.warm} />
          </G>
          <G x={50} y={150}>
            <Circle r={20} fill={theme.warm} opacity={0.18} />
            <Circle r={10} fill={theme.warm} />
            <Circle r={4} fill="#fff" />
          </G>
        </Svg>
      </View>

      <View className="mt-6">
        <Text className="text-[11px] font-bold text-warm tracking-[1.2px]">TRACKLY</Text>
        <Text className="text-[32px] font-bold text-ink mt-[6px] leading-[34px] tracking-[-0.8px]">
          Saiba exatamente{'\n'}onde seu filho está.
        </Text>
        <Text className="text-sm text-ink-muted mt-[10px] leading-5">
          Rastreamento da van ao vivo, motoristas verificados e notificações no momento em que seu
          filho embarca ou chega.
        </Text>

        <View className="mt-[22px] gap-[9px]">
          <Pressable
            onPress={onContinue}
            className="p-[14px] rounded-2xl bg-ink items-center"
          >
            <Text className="text-canvas text-[15px] font-semibold tracking-[-0.2px]">Começar</Text>
          </Pressable>
          <Pressable
            onPress={onInviteCode}
            className="p-[14px] rounded-2xl border border-line items-center"
          >
            <Text className="text-ink text-[15px] font-semibold">Tenho um código de convite</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
