import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Icon } from './Icon';
import { theme } from '../theme';

const TABS = [
  { id: 'route', label: 'Rota', icon: 'map' },
  { id: 'checkin', label: 'Check-in', icon: 'check' },
  { id: 'profile', label: 'Perfil', icon: 'user' },
] as const;

type Props = {
  active: string;
  onTab: (id: string) => void;
};

export function DriverTabBar({ active, onTab }: Props) {
  return (
    <View className="flex-row justify-around bg-surface border-t border-line pt-[10px] pb-[22px] px-2">
      {TABS.map((t) => {
        const on = active === t.id;
        const color = on ? theme.warm : theme.textMuted;
        return (
          <Pressable
            key={t.id}
            onPress={() => onTab(t.id)}
            className="items-center px-[10px] py-1"
          >
            <Icon name={t.icon} size={24} color={color} />
            <Text className="text-[10px] font-semibold mt-[3px]" style={{ color }}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
