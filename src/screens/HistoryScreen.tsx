import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { theme } from '../theme';
import { Icon } from '../components/Icon';

type Tone = 'success' | 'base' | 'warm';

type HistoryItem = {
  mon: string;
  day: string;
  label: string;
  pickup: string;
  arrive: string;
  driver: string;
  flag?: string;
};

const HISTORY: HistoryItem[] = [
  { mon: 'MAI', day: '14', label: 'Manhã · Embarque', pickup: '8:12', arrive: '8:39', driver: 'Marcus T' },
  { mon: 'MAI', day: '13', label: 'Tarde · Desembarque', pickup: '15:02', arrive: '15:36', driver: 'Marcus T' },
  { mon: 'MAI', day: '13', label: 'Manhã · Embarque', pickup: '8:14', arrive: '8:48', driver: 'Marcus T', flag: '+6m atraso' },
  { mon: 'MAI', day: '12', label: 'Tarde · Desembarque', pickup: '15:00', arrive: '15:24', driver: 'Lena R' },
  { mon: 'MAI', day: '12', label: 'Manhã · Embarque', pickup: '8:11', arrive: '8:40', driver: 'Marcus T' },
  { mon: 'MAI', day: '9', label: 'Tarde · Desembarque', pickup: '15:01', arrive: '15:21', driver: 'Marcus T' },
];

export function HistoryScreen() {
  return (
    <View className="flex-1 bg-canvas">
      <View className="px-5 pt-1 pb-[6px]">
        <Text className="text-[22px] font-bold text-ink tracking-[-0.5px]">Histórico de viagens</Text>
        <Text className="text-[13px] text-ink-muted mt-[2px]">Últimos 7 dias · Ezra</Text>
      </View>

      <View className="px-5 py-3 flex-row gap-[10px]">
        <Stat label="No horário" value="14/14" tone="success" />
        <Stat label="Chegada média" value="8:41" tone="base" />
        <Stat label="Duração média" value="22m" tone="warm" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 }}>
        {HISTORY.map((h, i) => (
          <View
            key={i}
            className="p-[14px] mb-2 bg-surface rounded-2xl border border-line flex-row gap-3 items-center"
          >
            <View className="w-11 h-11 rounded-[14px] bg-surface-alt items-center justify-center">
              <Text className="text-[9px] font-bold text-ink-muted tracking-[0.5px]">{h.mon}</Text>
              <Text className="text-[17px] font-bold text-ink leading-[18px]">{h.day}</Text>
            </View>
            <View className="flex-1">
              <View className="flex-row gap-[6px] items-center">
                <Text className="text-[13px] font-bold text-ink">{h.label}</Text>
                {h.flag && (
                  <View
                    className="py-[2px] px-[7px] rounded-full"
                    style={{ backgroundColor: `${theme.warm}22` }}
                  >
                    <Text className="text-[10px] font-semibold text-warm">{h.flag}</Text>
                  </View>
                )}
              </View>
              <Text className="text-[11px] text-ink-muted mt-[2px]">
                Embarque {h.pickup} · Chegada {h.arrive} · {h.driver}
              </Text>
            </View>
            <Icon name="chevron" size={16} color={theme.textFaint} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  const c = tone === 'success' ? theme.success : tone === 'warm' ? theme.warm : theme.base;
  return (
    <View className="flex-1 p-3 bg-surface rounded-[14px] border border-line">
      <Text className="text-[10px] text-ink-muted font-semibold uppercase tracking-[0.5px]">
        {label}
      </Text>
      <Text className="text-[19px] font-bold mt-[2px] tracking-[-0.4px]" style={{ color: c }}>
        {value}
      </Text>
    </View>
  );
}
