import React, { useMemo } from 'react';
import { View, Text, ScrollView, Alert, Pressable } from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../../components/Icon';
import { PressScale } from '../../components/PressScale';
import { useMyVans, type DriverVan, type VanRoute } from '../../lib/driver';
import { useActiveTrip, useStartTrip } from '../../lib/trip';

type Props = {
  onOpenCheckin?: (tripId: string) => void;
  onCreate?: () => void;
};

export function DriverRouteScreen({ onOpenCheckin, onCreate }: Props = {}) {
  const { data: vans = [], isLoading } = useMyVans();

  // Flatten { van, route } pairs for easier rendering.
  const flat = useMemo(() => {
    const out: { van: DriverVan; route: VanRoute }[] = [];
    for (const van of vans) for (const route of van.routes) out.push({ van, route });
    return out;
  }, [vans]);

  return (
    <View className="flex-1 bg-canvas">
      <View className="px-5 pt-1 pb-3 flex-row items-end justify-between">
        <View>
          <Text className="text-[11px] font-bold text-warm tracking-[1.2px]">HOJE</Text>
          <Text className="text-[22px] font-bold text-ink tracking-[-0.5px] mt-[2px]">
            Suas rotas
          </Text>
        </View>
        {onCreate && (
          <Pressable
            onPress={onCreate}
            hitSlop={8}
            className="flex-row items-center bg-surface rounded-full border border-line"
            style={{ paddingVertical: 7, paddingHorizontal: 12, gap: 6 }}
          >
            <Icon name="plus" size={14} color={theme.text} />
            <Text className="text-[12px] font-semibold text-ink">Nova rota</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
      >
        {!isLoading && flat.length === 0 && (
          <Pressable
            onPress={onCreate}
            className="mt-2 p-4 rounded-[18px] bg-surface flex-row items-start"
            style={{
              gap: 12,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: theme.lineStrong,
            }}
          >
            <View
              className="items-center justify-center"
              style={{
                width: 40,
                height: 40,
                borderRadius: 13,
                backgroundColor: `${theme.warm}1A`,
              }}
            >
              <Icon name="plus" size={20} color={theme.warm} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-ink">Criar sua primeira rota</Text>
              <Text className="text-[12px] text-ink-muted mt-[2px] leading-[17px]">
                Cadastre a escola, a van e os horários. Crianças vinculam depois via código de
                convite.
              </Text>
            </View>
            <Icon name="chevron" size={16} color={theme.textFaint} />
          </Pressable>
        )}

        {flat.map(({ van, route }) => (
          <RouteRow key={route.id} van={van} route={route} onOpenCheckin={onOpenCheckin} />
        ))}
      </ScrollView>
    </View>
  );
}

function RouteRow({
  van,
  route,
  onOpenCheckin,
}: {
  van: DriverVan;
  route: VanRoute;
  onOpenCheckin?: (tripId: string) => void;
}) {
  const { data: trip } = useActiveTrip(route.id);
  const start = useStartTrip();
  const busy = start.isPending;

  const dirLabel = route.direction === 'pickup' ? 'Embarque' : 'Desembarque';
  const directionGoing = route.direction === 'pickup' ? 'pra escola' : 'pra casa';
  const isNow = isWithinWindow(route.pickup_start, 30);
  const timeRange =
    route.pickup_start && route.arrival_time
      ? `${formatTime(route.pickup_start)}–${formatTime(route.arrival_time)}`
      : route.pickup_start
        ? formatTime(route.pickup_start)
        : null;

  const handleStart = async () => {
    try {
      const tripId = await start.mutateAsync(route.id);
      onOpenCheckin?.(tripId);
    } catch (e) {
      Alert.alert('Erro ao iniciar viagem', (e as Error).message);
    }
  };

  const active = !!trip;
  const elapsedMin = trip
    ? Math.max(0, Math.round((Date.now() - new Date(trip.started_at).getTime()) / 60000))
    : 0;
  const eventKidCount = trip
    ? new Set(
        trip.events
          .filter((e) => e.event === 'boarded' || e.event === 'dropped')
          .map((e) => e.kid_id),
      ).size
    : 0;

  return (
    <View
      className="mt-3 p-4 rounded-[18px] bg-surface"
      style={{
        borderWidth: 1,
        borderColor: active ? `${theme.success}55` : theme.line,
      }}
    >
      <View className="flex-row items-center" style={{ gap: 12 }}>
        <View
          className="items-center justify-center"
          style={{
            width: 44,
            height: 44,
            borderRadius: 13,
            backgroundColor: van.van_color ? `${van.van_color}22` : `${theme.base}1A`,
          }}
        >
          <Icon
            name={route.direction === 'pickup' ? 'route' : 'pin'}
            size={22}
            color={van.van_color ?? theme.base}
          />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center" style={{ gap: 6, flexWrap: 'wrap' }}>
            <Text className="text-[15px] font-bold text-ink tracking-[-0.2px]">
              Van {van.van_label}
              <Text className="font-medium text-ink-muted">
                {' · '}
                {dirLabel}
              </Text>
            </Text>
            {active && (
              <View
                className="py-[2px] px-2 rounded-full"
                style={{ backgroundColor: `${theme.success}1A` }}
              >
                <Text
                  className="text-[10px] font-bold tracking-[0.3px]"
                  style={{ color: theme.success }}
                >
                  EM ANDAMENTO
                </Text>
              </View>
            )}
            {!active && isNow && (
              <View
                className="py-[2px] px-2 rounded-full"
                style={{ backgroundColor: `${theme.warm}1A` }}
              >
                <Text
                  className="text-[10px] font-bold tracking-[0.3px]"
                  style={{ color: theme.warm }}
                >
                  AGORA
                </Text>
              </View>
            )}
          </View>
          <Text className="text-[12px] text-ink-muted mt-[1px]">
            {van.school?.name ?? 'Sem escola'}
            {timeRange ? ` · ${timeRange}` : ''}
          </Text>
        </View>
      </View>

      {active && trip ? (
        <View className="mt-3 flex-row" style={{ gap: 8 }}>
          <View className="flex-1 bg-surface-alt rounded-xl py-[10px] px-3">
            <Text className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.4px]">
              Decorrido
            </Text>
            <Text className="text-[15px] font-bold text-ink mt-[1px]">{elapsedMin} min</Text>
          </View>
          <View className="flex-1 bg-surface-alt rounded-xl py-[10px] px-3">
            <Text className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.4px]">
              Crianças
            </Text>
            <Text className="text-[15px] font-bold text-ink mt-[1px]">{eventKidCount}</Text>
          </View>
          <PressScale
            onPress={() => onOpenCheckin?.(trip.id)}
            style={{
              flex: 2,
              padding: 12,
              backgroundColor: theme.text,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text className="text-canvas text-[13px] font-bold">Ver check-in</Text>
          </PressScale>
        </View>
      ) : (
        <PressScale
          onPress={handleStart}
          disabled={busy}
          style={{
            marginTop: 12,
            padding: 12,
            backgroundColor: isNow ? theme.warm : theme.text,
            borderRadius: 12,
            alignItems: 'center',
            opacity: busy ? 0.6 : 1,
          }}
        >
          <Text className="text-canvas text-[14px] font-bold tracking-[-0.2px]">
            {busy ? 'Iniciando…' : `Iniciar ${dirLabel.toLowerCase()} ${directionGoing}`}
          </Text>
        </PressScale>
      )}
    </View>
  );
}

function formatTime(t: string): string {
  const [h, m] = t.split(':');
  return `${Number(h)}:${m}`;
}

/** True if the route's scheduled time is within ±windowMin minutes of now. */
function isWithinWindow(scheduled: string | null, windowMin: number): boolean {
  if (!scheduled) return false;
  const [h, m] = scheduled.split(':');
  if (!h || !m) return false;
  const now = new Date();
  const scheduledMin = Number(h) * 60 + Number(m);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return Math.abs(scheduledMin - nowMin) <= windowMin;
}
