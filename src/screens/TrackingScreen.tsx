import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { theme } from '../theme';
import { KIDS, STOPS, DRIVER } from '../data';
import { MapView } from '../components/MapView';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icon';

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};

export function TrackingScreen() {
  const [child, setChild] = useState<string>('ezra');
  const [progress, setProgress] = useState(0.55);
  const [playing, setPlaying] = useState(true);
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    let raf: number;
    lastRef.current = null;
    const tick = (now: number) => {
      const last = lastRef.current ?? now;
      const dt = (now - last) / 1000;
      lastRef.current = now;
      setProgress((p) => {
        const next = p + dt * 0.025;
        if (next >= 0.95) {
          setPlaying(false);
          return 0.95;
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const eta = Math.max(1, Math.round((1 - progress) * 24));
  const distance = Math.max(0.1, (1 - progress) * 4.2).toFixed(1);
  const stopsRemaining = 6 - Math.round(progress * 4);
  const currentIdx = Math.round(progress * 4);

  return (
    <View className="flex-1 bg-canvas">
      {/* Header */}
      <View className="px-5 pt-1 pb-[14px]">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[13px] text-ink-muted font-medium">Bom dia, Sara</Text>
            <Text className="text-[22px] font-bold text-ink tracking-[-0.5px] mt-[2px]">
              A van está a caminho
            </Text>
          </View>
          <View className="w-[38px] h-[38px] rounded-full bg-surface border border-line items-center justify-center">
            <Icon name="bell" size={18} color={theme.text} />
            <View className="absolute top-[6px] right-2 w-2 h-2 rounded-full bg-warm border-2 border-surface" />
          </View>
        </View>

        {/* child chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-[14px]"
          contentContainerStyle={{ gap: 8 }}
        >
          {KIDS.map((k) => {
            const on = k.id === child;
            return (
              <Pressable
                key={k.id}
                onPress={() => setChild(k.id)}
                className="flex-row items-center gap-2 py-[5px] pl-[5px] pr-[11px] rounded-full border"
                style={{
                  backgroundColor: on ? theme.text : theme.surface,
                  borderColor: on ? theme.text : theme.line,
                }}
              >
                <Avatar name={k.name} size={26} bg={k.color} />
                <Text
                  className="text-[13px] font-semibold"
                  style={{ color: on ? theme.canvas : theme.text }}
                >
                  {k.name}
                </Text>
                <Text
                  className="text-[11px] font-medium"
                  style={{ color: on ? 'rgba(255,255,255,0.6)' : theme.textMuted }}
                >
                  · {k.grade}º ano
                </Text>
              </Pressable>
            );
          })}
          <View
            className="w-9 h-9 rounded-full bg-surface items-center justify-center"
            style={{ borderWidth: 1, borderColor: theme.lineStrong, borderStyle: 'dashed' }}
          >
            <Icon name="plus" size={18} color={theme.textMuted} />
          </View>
        </ScrollView>
      </View>

      {/* Map card */}
      <View className="mx-4 rounded-3xl overflow-hidden bg-map-bg">
        <MapView progress={progress} height={300} />

        {/* ETA badge */}
        <View
          className="absolute top-[14px] left-[14px] py-2 px-3 bg-surface rounded-2xl flex-row items-center gap-[10px]"
          style={CARD_SHADOW}
        >
          <View
            className="w-[34px] h-[34px] rounded-[10px] items-center justify-center"
            style={{ backgroundColor: `${theme.base}1A` }}
          >
            <Icon name="car" size={18} color={theme.base} />
          </View>
          <View>
            <Text className="text-[10px] text-ink-muted font-semibold uppercase tracking-[0.4px]">
              Chegada em
            </Text>
            <Text className="text-lg font-bold text-ink tracking-[-0.4px]">
              {eta} min{' '}
              <Text className="text-xs text-ink-muted font-medium">· {distance} km</Text>
            </Text>
          </View>
        </View>

        {/* play/pause */}
        <Pressable
          onPress={() => setPlaying((p) => !p)}
          className="absolute top-[14px] right-[14px] w-9 h-9 rounded-full bg-surface items-center justify-center"
          style={{ shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
        >
          <Icon name={playing ? 'pause' : 'play'} size={16} color={theme.text} />
        </Pressable>

        {/* driver card */}
        <View
          className="absolute bottom-[14px] left-[14px] right-[14px] py-[10px] px-3 bg-surface rounded-2xl flex-row items-center gap-[10px]"
          style={CARD_SHADOW}
        >
          <Avatar name={DRIVER.name} size={32} bg={DRIVER.color} />
          <View className="flex-1">
            <Text className="text-[13px] font-semibold text-ink">{DRIVER.name} · Motorista</Text>
            <View className="flex-row items-center gap-[6px] mt-[1px]">
              <Icon name="star" size={10} color={theme.warm} />
              <Text className="text-[11px] text-ink-muted">
                {DRIVER.rating} · Van #{DRIVER.van}
              </Text>
            </View>
          </View>
          <View className="w-[34px] h-[34px] rounded-full bg-success items-center justify-center">
            <Icon name="phone" size={15} color="#fff" />
          </View>
          <View className="w-[34px] h-[34px] rounded-full bg-brand items-center justify-center">
            <Icon name="chat" size={15} color="#fff" filled />
          </View>
        </View>
      </View>

      {/* Upcoming stops */}
      <ScrollView
        className="flex-1 mt-[18px]"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4 }}
      >
        <View className="flex-row justify-between items-baseline mb-[10px]">
          <Text className="text-[11px] text-ink-muted font-semibold uppercase tracking-[0.6px]">
            Próximas paradas
          </Text>
          <Text className="text-xs text-ink-faint font-medium">{stopsRemaining} de 6</Text>
        </View>

        {STOPS.map((s, i) => {
          const done = i < progress * 4;
          const now = i === currentIdx;
          return (
            <View key={i} className="flex-row items-center gap-[14px] py-2">
              <View className="w-[18px] items-center">
                <View
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: done ? theme.success : now ? theme.warm : theme.surface,
                    borderWidth: done ? 0 : 2,
                    borderColor: now ? theme.warm : theme.lineStrong,
                  }}
                />
                {i < STOPS.length - 1 && (
                  <View
                    className="absolute top-[18px] -bottom-[18px] w-[2px]"
                    style={{ backgroundColor: done ? theme.success : theme.line }}
                  />
                )}
              </View>
              <View className="flex-1">
                <Text
                  className="text-sm"
                  style={{
                    fontWeight: now ? '700' : '500',
                    color: done ? theme.textMuted : theme.text,
                  }}
                >
                  {s.name}
                </Text>
                <Text className="text-[11px] text-ink-faint">{s.addr}</Text>
              </View>
              <View className="items-end">
                <Text
                  className="text-[13px] font-semibold"
                  style={{ color: now ? theme.warm : done ? theme.textMuted : theme.text }}
                >
                  {s.time}
                </Text>
                {done && <Text className="text-[10px] text-success font-semibold">Embarcado</Text>}
                {now && <Text className="text-[10px] text-warm font-semibold">Na parada</Text>}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
