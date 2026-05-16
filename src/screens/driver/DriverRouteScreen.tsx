import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { theme } from '../../theme';
import { STOPS } from '../../data';
import { MapView } from '../../components/MapView';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';

export function DriverRouteScreen() {
  const [progress, setProgress] = useState(0.45);
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

  const currentIdx = Math.min(STOPS.length - 1, Math.round(progress * 4));
  const next = STOPS[currentIdx]!;

  return (
    <View className="flex-1 bg-canvas">
      <View className="px-5 pt-1 pb-3 flex-row items-center justify-between">
        <View>
          <Text className="text-[11px] text-ink-muted font-semibold uppercase tracking-[0.5px]">
            Rota da manhã · Van VK-32
          </Text>
          <Text className="text-[22px] font-bold text-ink tracking-[-0.5px] mt-[2px]">Embarque</Text>
        </View>
        <View
          className="py-1 px-[10px] rounded-full flex-row items-center gap-[6px]"
          style={{ backgroundColor: `${theme.success}22` }}
        >
          <View className="w-[6px] h-[6px] rounded-full bg-success" />
          <Text className="text-[11px] font-bold text-success tracking-[0.3px]">NO HORÁRIO</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 16 }}>
        <View className="mx-4 rounded-[22px] overflow-hidden">
          <MapView progress={progress} height={210} />
          <View className="absolute bottom-0 left-0 right-0 flex-row items-center gap-3 px-[14px] py-[10px] bg-black/40">
            <View className="flex-1">
              <Text className="text-white text-[10px] font-bold tracking-[0.8px] opacity-85">
                PRÓXIMA PARADA
              </Text>
              <Text className="text-white text-[15px] font-bold tracking-[-0.3px]">
                {next.name} · {next.addr}
              </Text>
            </View>
            <Pressable
              onPress={() => setPlaying((p) => !p)}
              className="w-[42px] h-[42px] rounded-full bg-white items-center justify-center"
            >
              <Icon name={playing ? 'pause' : 'play'} size={18} color={theme.base} />
            </Pressable>
          </View>
        </View>

        <View
          className="mx-4 mt-[14px] p-4 rounded-[18px] bg-surface border border-line"
          style={{
            shadowColor: theme.base,
            shadowOpacity: 0.09,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 6 },
            elevation: 2,
          }}
        >
          <View className="flex-row gap-3 items-center">
            <Avatar name={next.name} size={48} bg={theme.warm} />
            <View className="flex-1">
              <Text className="text-[10px] text-warm font-bold tracking-[0.6px]">CHEGANDO AGORA</Text>
              <Text className="text-[17px] font-bold text-ink tracking-[-0.3px]">{next.name}</Text>
              <Text className="text-[11px] text-ink-muted">
                {next.addr} · Resp.: Sara V.
              </Text>
            </View>
            <View
              className="w-[38px] h-[38px] rounded-full items-center justify-center"
              style={{ backgroundColor: `${theme.success}22` }}
            >
              <Icon name="phone" size={16} color={theme.success} />
            </View>
          </View>
          <View className="flex-row gap-2 mt-[14px]">
            <Pressable className="flex-[2] py-3 rounded-xl bg-warm flex-row items-center justify-center gap-2">
              <Icon name="check" size={16} color="#fff" />
              <Text className="text-white text-sm font-bold">Embarcar</Text>
            </Pressable>
            <Pressable className="px-[14px] py-3 rounded-xl bg-surface-alt">
              <Text className="text-ink text-sm font-semibold">Faltou</Text>
            </Pressable>
          </View>
        </View>

        <View className="px-5 mt-[14px]">
          <Text className="text-[11px] text-ink-muted font-bold uppercase tracking-[0.6px] mb-2">
            Lista · 5 de 6
          </Text>
          <View className="gap-[6px]">
            {STOPS.slice(0, 5).map((s, i) => {
              const status = i < currentIdx ? 'on' : i === currentIdx ? 'now' : 'wait';
              const cfg =
                status === 'on'
                  ? { bg: `${theme.success}1A`, fg: theme.success, label: 'EMBARCADO' }
                  : status === 'now'
                    ? { bg: `${theme.warm}1A`, fg: theme.warm, label: 'NA PARADA' }
                    : { bg: theme.surfaceAlt, fg: theme.textMuted, label: 'AGUARDANDO' };
              const colors = ['#E08A2A', '#3A5BD9', '#1F7A4E', '#9F5BC0', '#5B7A9F'];
              return (
                <View
                  key={i}
                  className="flex-row items-center gap-3 py-[10px] px-3 bg-surface rounded-[14px] border border-line"
                >
                  <Avatar name={s.name} size={34} bg={colors[i % 5]!} />
                  <View className="flex-1">
                    <Text className="text-[13px] font-semibold text-ink">{s.name}</Text>
                    <Text className="text-[11px] text-ink-muted">
                      {s.addr} · {s.time}
                    </Text>
                  </View>
                  <View
                    className="py-[3px] px-2 rounded-full"
                    style={{ backgroundColor: cfg.bg }}
                  >
                    <Text className="text-[10px] font-bold" style={{ color: cfg.fg }}>
                      {cfg.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
