import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps } from 'react-native';

type Props = PressableProps & {
  scaleTo?: number;
  children: React.ReactNode;
};

export function PressScale({ scaleTo = 0.97, children, onPressIn, onPressOut, style, ...rest }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const animate = (to: number) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: true, friction: 7, tension: 140 }).start();

  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        animate(scaleTo);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        animate(1);
        onPressOut?.(e);
      }}
    >
      {(state) => (
        <Animated.View style={[typeof style === 'function' ? style(state) : style, { transform: [{ scale }] }]}>
          {typeof children === 'function' ? (children as (s: typeof state) => React.ReactNode)(state) : children}
        </Animated.View>
      )}
    </Pressable>
  );
}
