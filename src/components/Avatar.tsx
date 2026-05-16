import React from 'react';
import { View, Text } from 'react-native';

type Props = {
  name: string;
  size?: number;
  bg?: string;
  fg?: string;
};

export function Avatar({ name, size = 36, bg = '#888', fg = '#fff' }: Props) {
  const initials = name
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg }}
    >
      <Text
        className="font-semibold"
        style={{ color: fg, fontSize: size * 0.4, letterSpacing: -0.3 }}
      >
        {initials}
      </Text>
    </View>
  );
}
