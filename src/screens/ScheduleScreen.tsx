import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { theme } from '../theme';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icon';
import { useMyKids, type MyKid } from '../lib/kids';

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

// Derive one trip card per route the parent's kids share.
function buildTrips(kids: MyKid[]): Trip[] {
  const byRoute = new Map<string, { kids: MyKid[]; route: MyKid['route'] }>();
  for (const k of kids) {
    if (!k.route) continue;
    const entry = byRoute.get(k.route.id) ?? { kids: [], route: k.route };
    entry.kids.push(k);
    byRoute.set(k.route.id, entry);
  }

  const ordered = [...byRoute.values()].sort((a, b) =>
    (a.route?.direction ?? '').localeCompare(b.route?.direction ?? ''),
  );

  return ordered.map(({ kids: rKids, route }, idx) => {
    const isPickup = route?.direction === 'pickup';
    const start = formatTime(route?.pickup_start);
    const end = formatTime(route?.arrival_time);
    const school = rKids[0]?.route?.school?.name ?? 'Escola';
    const firstPickup = rKids.map((k) => k.pickup?.address).find(Boolean) ?? '—';
    return {
      period: isPickup ? 'Embarque · pra escola' : 'Desembarque · pra casa',
      time: start && end ? `${start} – ${end}` : start || end || '—',
      status: idx === 0 ? 'A CAMINHO' : 'AGENDADO',
      statusTone: idx === 0 ? 'base' : 'muted',
      kids: rKids.map((k) => ({
        n: k.short_name ?? k.full_name,
        c: k.color ?? '#888',
      })),
      from: isPickup ? firstPickup : school,
      to: isPickup ? school : firstPickup,
      eta: end ? `Prev. ${end}` : 'Horário a definir',
      highlight: idx === 0,
    };
  });
}

function formatTime(t: string | null | undefined): string {
  if (!t) return '';
  const [h, m] = t.split(':');
  return `${Number(h)}:${m}`;
}

export function ScheduleScreen() {
  const { data: kids = [] } = useMyKids();
  const trips = useMemo(() => buildTrips(kids), [kids]);
  const uniqueKidCount = new Set(kids.map((k) => k.id)).size;
  return (
    <View className="flex-1 bg-canvas">
      <View className="px-5 pt-1 pb-4">
        <Text className="text-[22px] font-bold text-ink tracking-[-0.5px]">Esta semana</Text>
        <Text className="text-[13px] text-ink-muted mt-[2px]">
          {uniqueKidCount === 0
            ? 'Nenhuma criança vinculada'
            : `${uniqueKidCount} ${uniqueKidCount === 1 ? 'criança' : 'crianças'}`}
        </Text>
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
        {trips.length === 0 ? (
          <View className="bg-surface rounded-[18px] border border-line p-4">
            <Text className="text-[13px] text-ink-muted">
              Nenhuma viagem agendada. Insira um código de convite no perfil para vincular um filho.
            </Text>
          </View>
        ) : (
          trips.map((t, i) => <TripCard key={i} trip={t} />)
        )}

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
