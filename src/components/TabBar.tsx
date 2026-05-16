import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Icon } from './Icon';
import { theme } from '../theme';

const TABS = [
  { id: 'track', label: 'Trajeto', icon: 'map' },
  { id: 'schedule', label: 'Agenda', icon: 'route' },
  { id: 'chat', label: 'Chat', icon: 'chat' },
  { id: 'history', label: 'Histórico', icon: 'history' },
  { id: 'profile', label: 'Perfil', icon: 'user' },
] as const;

type Props = {
  active: string;
  onTab: (id: string) => void;
};

export function TabBar({ active, onTab }: Props) {
  return (
    <View className="flex-row justify-around bg-surface border-t border-line pt-[10px] pb-[22px] px-2">
      {TABS.map((t) => {
        const on = active === t.id;
        const color = on ? theme.base : theme.textMuted;
        return (
          <Pressable
            key={t.id}
            onPress={() => onTab(t.id)}
            className="items-center px-2 py-1"
          >
            <Icon name={t.icon} size={24} color={color} />
            <Text
              className="text-[10px] font-semibold mt-[3px] tracking-[0.1px]"
              style={{ color }}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
