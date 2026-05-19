import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { theme } from '../theme';
import { MapView } from '../components/MapView';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icon';
import { useMyKids } from '../lib/kids';
import { useRouteDetail } from '../lib/routes';
import { useProfile } from '../lib/profile';
import { useActiveTrip } from '../lib/trip';

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};

export function TrackingScreen() {
  const { data: kids } = useMyKids();
  const { data: profile } = useProfile();

  // One chip per (kid, route) pair so morning + afternoon show separately.
  const chips = useMemo(
    () =>
      (kids ?? []).map((k, idx) => ({
        key: `${k.id}:${k.route?.id ?? 'none'}:${idx}`,
        kidId: k.id,
        routeId: k.route?.id ?? null,
        name: k.short_name ?? k.full_name,
        grade: k.grade,
        color: k.color ?? '#888',
      })),
    [kids],
  );

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selected = useMemo(
    () => chips.find((c) => c.key === selectedKey) ?? chips[0] ?? null,
    [chips, selectedKey],
  );

  useEffect(() => {
    const first = chips[0];
    if (!selectedKey && first) setSelectedKey(first.key);
  }, [chips, selectedKey]);

  const { data: route } = useRouteDetail(selected?.routeId);
  const { data: trip } = useActiveTrip(selected?.routeId);
  const greeting = profile?.full_name?.split(' ')[0] ?? '';

  const tripActive = !!trip;
  // Progress is derived from how many distinct kids have a boarded/dropped
  // event vs. how many kid-stops the route has. Falls back to 0 when idle.
  const kidStopsCount = (route?.stops ?? []).filter((s) => !s.is_destination).length || 1;
  const eventKidCount = trip
    ? new Set(
        trip.events
          .filter((e) => e.event === 'boarded' || e.event === 'dropped')
          .map((e) => e.kid_id),
      ).size
    : 0;
  // The animation moves between ~0.05 (start) and ~0.95 (end). Map progress
  // proportionally so the van glides along the simulated path.
  const progress = tripActive
    ? Math.min(0.95, 0.05 + 0.9 * (eventKidCount / kidStopsCount))
    : 0;

  const stops = route?.stops ?? [];
  const eta = Math.max(1, Math.round((1 - progress) * 24));
  const distance = Math.max(0.1, (1 - progress) * 4.2).toFixed(1);
  const totalStops = stops.length || 6;
  const currentIdx = Math.round(progress * Math.max(1, totalStops - 2));
  const stopsRemaining = Math.max(0, totalStops - currentIdx);
  const driverName = route?.driver?.full_name ?? 'Motorista a ser atribuído';
  const vanLabel = route?.van_label ?? null;

  return (
    <View className="flex-1 bg-canvas">
      {/* Header */}
      <View className="px-5 pt-1 pb-[14px]">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[13px] text-ink-muted font-medium">
              Bom dia{greeting ? `, ${greeting}` : ''}
            </Text>
            <Text className="text-[22px] font-bold text-ink tracking-[-0.5px] mt-[2px]">
              {tripActive
                ? 'A van está a caminho'
                : route
                  ? 'Sem viagens ativas'
                  : 'Nenhuma rota vinculada'}
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
          {chips.map((c) => {
            const on = c.key === selected?.key;
            return (
              <Pressable
                key={c.key}
                onPress={() => setSelectedKey(c.key)}
                className="flex-row items-center gap-2 py-[5px] pl-[5px] pr-[11px] rounded-full border"
                style={{
                  backgroundColor: on ? theme.text : theme.surface,
                  borderColor: on ? theme.text : theme.line,
                }}
              >
                <Avatar name={c.name} size={26} bg={c.color} />
                <Text
                  className="text-[13px] font-semibold"
                  style={{ color: on ? theme.canvas : theme.text }}
                >
                  {c.name}
                </Text>
                {c.grade != null && (
                  <Text
                    className="text-[11px] font-medium"
                    style={{ color: on ? 'rgba(255,255,255,0.6)' : theme.textMuted }}
                  >
                    · {c.grade}º ano
                  </Text>
                )}
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

        {/* ETA badge — shown only when there's an active trip */}
        {tripActive && (
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
        )}

        {/* driver card */}
        <View
          className="absolute bottom-[14px] left-[14px] right-[14px] py-[10px] px-3 bg-surface rounded-2xl flex-row items-center gap-[10px]"
          style={CARD_SHADOW}
        >
          <Avatar name={driverName} size={32} bg={route?.van_color ?? '#5B7A9F'} />
          <View className="flex-1">
            <Text className="text-[13px] font-semibold text-ink">{driverName} · Motorista</Text>
            <View className="flex-row items-center gap-[6px] mt-[1px]">
              <Icon name="star" size={10} color={theme.warm} />
              <Text className="text-[11px] text-ink-muted">
                {vanLabel ? `Van #${vanLabel}` : 'Van não atribuída'}
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
          <Text className="text-xs text-ink-faint font-medium">
            {stopsRemaining} de {totalStops}
          </Text>
        </View>

        {stops.length === 0 && (
          <Text className="text-[13px] text-ink-muted mt-2">
            Esta rota ainda não tem paradas cadastradas.
          </Text>
        )}

        {stops.map((s, i) => {
          const done = i < progress * Math.max(1, totalStops - 2);
          const now = i === currentIdx;
          const isYou = s.kid_id && s.kid_id === selected?.kidId;
          // Compute the position number among kid stops (ignoring the school destination).
          const kidIndex = stops.slice(0, i).filter((x) => !x.is_destination).length;
          const stopLabel = isYou
            ? `${s.label ?? s.kid_names[0] ?? 'Você'} (você)`
            : s.is_anonymous
              ? `Parada ${kidIndex + 1}`
              : s.label || s.kid_names[0] || s.address;
          const subLabel = isYou
            ? s.address
            : s.is_anonymous
              ? null
              : s.address;
          const timeLabel = s.scheduled_time ? formatTime(s.scheduled_time) : '';
          return (
            <View key={s.id} className="flex-row items-center gap-[14px] py-2">
              <View className="w-[18px] items-center">
                <View
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: done ? theme.success : now ? theme.warm : theme.surface,
                    borderWidth: done ? 0 : 2,
                    borderColor: now ? theme.warm : isYou ? theme.base : theme.lineStrong,
                  }}
                />
                {i < stops.length - 1 && (
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
                    fontWeight: isYou || now ? '700' : '500',
                    color: s.is_anonymous
                      ? theme.textMuted
                      : done
                        ? theme.textMuted
                        : isYou
                          ? theme.base
                          : theme.text,
                  }}
                >
                  {stopLabel}
                </Text>
                {subLabel && (
                  <Text className="text-[11px] text-ink-faint">{subLabel}</Text>
                )}
              </View>
              <View className="items-end">
                <Text
                  className="text-[13px] font-semibold"
                  style={{ color: now ? theme.warm : done ? theme.textMuted : theme.text }}
                >
                  {timeLabel}
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

// "07:54:00" → "7:54"
function formatTime(t: string): string {
  const [h, m] = t.split(':');
  return `${Number(h)}:${m}`;
}
