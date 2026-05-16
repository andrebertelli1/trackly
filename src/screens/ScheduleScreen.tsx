import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { theme } from '../theme';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icon';

const DAYS = ['S', 'T', 'Q', 'Q', 'S'];

type Trip = {
  period: string;
  time: string;
  status: string;
  statusTone: 'base' | 'muted';
  kids: { n: string; c: string }[];
  from: string;
  to: string;
  eta: string;
  highlight?: boolean;
};

const TRIPS: Trip[] = [
  {
    period: 'Manhã · Embarque',
    time: '7:54 – 8:42',
    status: 'A CAMINHO',
    statusTone: 'base',
    kids: [
      { n: 'Ezra', c: '#E08A2A' },
      { n: 'Iris', c: '#3A5BD9' },
    ],
    from: 'Av. Maple 88',
    to: 'Escola Greenfield',
    eta: 'Prev. 8:42',
    highlight: true,
  },
  {
    period: 'Tarde · Desembarque',
    time: '14:30 – 15:18',
    status: 'AGENDADO',
    statusTone: 'muted',
    kids: [
      { n: 'Ezra', c: '#E08A2A' },
      { n: 'Iris', c: '#3A5BD9' },
      { n: 'Theo', c: '#1F7A4E' },
    ],
    from: 'Escola Greenfield',
    to: 'Av. Maple 88',
    eta: 'Prev. 15:02',
  },
];

export function ScheduleScreen() {
  return (
    <View className="flex-1 bg-canvas">
      <View className="px-5 pt-1 pb-4">
        <Text className="text-[22px] font-bold text-ink tracking-[-0.5px]">Esta semana</Text>
        <Text className="text-[13px] text-ink-muted mt-[2px]">11 a 15 de maio · 3 crianças</Text>
      </View>

      <View className="px-5 flex-row gap-2 mb-[14px]">
        {DAYS.map((d, i) => {
          const on = i === 2;
          return (
            <View
              key={i}
              className="flex-1 py-[10px] rounded-[14px] items-center"
              style={{
                backgroundColor: on ? theme.text : theme.surface,
                borderWidth: on ? 0 : 1,
                borderColor: theme.line,
              }}
            >
              <Text
                className="text-[10px] font-semibold tracking-[0.5px] opacity-55"
                style={{ color: on ? theme.canvas : theme.text }}
              >
                {d}
              </Text>
              <Text
                className="text-base font-bold mt-[2px]"
                style={{ color: on ? theme.canvas : theme.text }}
              >
                {11 + i}
              </Text>
              <View
                className="w-1 h-1 rounded-full mt-1"
                style={{ backgroundColor: on ? theme.canvas : theme.base }}
              />
            </View>
          );
        })}
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        {TRIPS.map((t, i) => (
          <TripCard key={i} trip={t} />
        ))}

        <View
          className="mt-[14px] p-[14px] rounded-[18px] flex-row gap-3 items-start"
          style={{ backgroundColor: `${theme.warm}1A` }}
        >
          <View className="w-8 h-8 rounded-[10px] bg-warm items-center justify-center">
            <Icon name="bolt" size={16} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="text-[13px] font-bold text-ink">Mudança pontual?</Text>
            <Text className="text-xs text-ink-muted mt-[2px]">
              Pule uma viagem ou mude o desembarque — Marcus será avisado.
            </Text>
          </View>
          <Pressable className="bg-ink py-[7px] px-3 rounded-[10px]">
            <Text className="text-canvas text-xs font-semibold">Solicitar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function TripCard({ trip }: { trip: Trip }) {
  const statusBg = trip.statusTone === 'base' ? `${theme.base}1A` : theme.surfaceAlt;
  const statusFg = trip.statusTone === 'base' ? theme.base : theme.textMuted;
  return (
    <View
      className="p-4 rounded-[18px] bg-surface mb-[10px]"
      style={{
        borderWidth: 1,
        borderColor: trip.highlight ? `${theme.base}33` : theme.line,
        shadowColor: theme.base,
        shadowOpacity: trip.highlight ? 0.13 : 0,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 6 },
        elevation: trip.highlight ? 2 : 0,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.4px]">
            {trip.period}
          </Text>
          <Text className="text-[17px] font-bold text-ink mt-[2px] tracking-[-0.3px]">
            {trip.time}
          </Text>
        </View>
        <View
          className="py-1 px-[10px] rounded-full"
          style={{ backgroundColor: statusBg }}
        >
          <Text
            className="text-[11px] font-semibold tracking-[-0.1px]"
            style={{ color: statusFg }}
          >
            {trip.status}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-[14px] items-center mt-3">
        <View className="flex-row">
          {trip.kids.map((k, i) => (
            <View
              key={i}
              className="border-2 border-surface rounded-[14px]"
              style={{ marginLeft: i ? -8 : 0 }}
            >
              <Avatar name={k.n} size={26} bg={k.c} />
            </View>
          ))}
        </View>
        <View className="flex-1 h-px bg-line" />
        <Text className="text-[11px] text-ink-muted font-semibold">{trip.eta}</Text>
      </View>

      <View className="mt-3 flex-row items-center gap-[10px]">
        <View className="w-2 h-2 rounded-full bg-warm" />
        <Text className="text-xs text-ink font-medium">{trip.from}</Text>
      </View>
      <View className="ml-[3px] w-[2px] h-[14px] bg-line" />
      <View className="flex-row items-center gap-[10px]">
        <View className="w-2 h-2 rounded-full bg-success" />
        <Text className="text-xs text-ink font-medium">{trip.to}</Text>
      </View>
    </View>
  );
}
