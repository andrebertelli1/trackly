import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { theme } from '../../theme';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { PressScale } from '../../components/PressScale';
import { useMyVans } from '../../lib/driver';
import {
  useMyActiveTrips,
  useFinishTrip,
  useKidsOnRoute,
  useRecordKidEvent,
  reduceKidState,
  type KidOnRoute,
  type KidState,
  type TripEventKind,
} from '../../lib/trip';

type Props = {
  /** Trip the driver just started; if null, fall back to whatever's active. */
  selectedTripId: string | null;
  onSelectedTripCleared?: () => void;
};

export function DriverCheckinScreen({ selectedTripId, onSelectedTripCleared }: Props) {
  const { data: vans = [] } = useMyVans();
  const { data: trips = [], isLoading } = useMyActiveTrips();

  const routeIds = useMemo(
    () => vans.flatMap((v) => v.routes.map((r) => r.id)),
    [vans],
  );

  // Pick which trip to display: selectedTripId wins if it's still active;
  // otherwise the most-recently-started trip.
  const visibleTrip = useMemo(() => {
    if (!trips.length) return null;
    if (selectedTripId) {
      const match = trips.find((t) => t.id === selectedTripId);
      if (match) return match;
    }
    return trips[0]!;
  }, [trips, selectedTripId]);

  return (
    <View className="flex-1 bg-canvas">
      <View className="px-5 pt-1 pb-3">
        <Text className="text-[22px] font-bold text-ink tracking-[-0.5px]">Check-in</Text>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      >
        {routeIds.length === 0 ? (
          <EmptyState message="Nenhuma rota cadastrada. Crie uma van na aba Perfil." />
        ) : !visibleTrip ? (
          <EmptyState
            message={
              isLoading
                ? 'Carregando…'
                : 'Nenhuma viagem em andamento. Inicie uma na aba Rota.'
            }
          />
        ) : (
          <>
            {trips.length > 1 && (
              <Text className="mb-2 text-[11px] text-ink-faint">
                Você tem {trips.length} viagens em andamento — mostrando a mais recente.
              </Text>
            )}
            <ActiveTripCard
              tripId={visibleTrip.id}
              routeId={visibleTrip.route_id}
              startedAt={visibleTrip.started_at}
              events={visibleTrip.events}
              onCleared={onSelectedTripCleared}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ActiveTripCard({
  tripId,
  routeId,
  startedAt,
  events,
  onCleared,
}: {
  tripId: string;
  routeId: string;
  startedAt: string;
  events: { id: string; kid_id: string; event: TripEventKind; created_at: string }[];
  onCleared?: () => void;
}) {
  const { data: vans = [] } = useMyVans();
  const { data: kids = [], isLoading } = useKidsOnRoute(routeId);
  const recordEvent = useRecordKidEvent();
  const finish = useFinishTrip();

  // Tick every minute to keep the elapsed-time fresh.
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Resolve route metadata.
  const meta = useMemo(() => {
    for (const v of vans) {
      for (const r of v.routes) {
        if (r.id === routeId) {
          return {
            vanLabel: v.van_label,
            schoolName: v.school?.name ?? null,
            direction: r.direction,
          };
        }
      }
    }
    return null;
  }, [vans, routeId]);

  const direction = meta?.direction ?? 'pickup';
  const elapsedMin = Math.max(
    0,
    Math.round((Date.now() - new Date(startedAt).getTime()) / 60000),
  );

  const handleEvent = async (kid_id: string, kind: TripEventKind) => {
    try {
      await recordEvent.mutateAsync({ trip_id: tripId, kid_id, event: kind });
    } catch (e) {
      Alert.alert('Erro', (e as Error).message);
    }
  };

  const handleFinish = () =>
    Alert.alert(
      'Finalizar viagem?',
      'Esta ação encerra o check-in. Pais deixarão de ver a viagem como ativa.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          style: 'destructive',
          onPress: async () => {
            try {
              await finish.mutateAsync(tripId);
              onCleared?.();
            } catch (e) {
              Alert.alert('Erro ao finalizar', (e as Error).message);
            }
          },
        },
      ],
    );

  return (
    <View>
      <View
        className="mt-2 p-4 rounded-[18px]"
        style={{
          backgroundColor: `${theme.success}10`,
          borderWidth: 1,
          borderColor: `${theme.success}40`,
        }}
      >
        <View className="flex-row items-center" style={{ gap: 12 }}>
          <View
            className="items-center justify-center"
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              backgroundColor: `${theme.success}22`,
            }}
          >
            <Icon name="route" size={22} color={theme.success} />
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-bold text-ink tracking-[-0.2px]">
              {meta ? `Van ${meta.vanLabel}` : 'Viagem em andamento'}
              {meta && (
                <Text className="font-medium text-ink-muted">
                  {' · '}
                  {direction === 'pickup' ? 'Embarque' : 'Desembarque'}
                </Text>
              )}
            </Text>
            <Text className="text-[12px] text-ink-muted mt-[1px]">
              {meta?.schoolName ?? ''} · em andamento há {elapsedMin} min
            </Text>
          </View>
        </View>
      </View>

      <Text className="mt-4 mx-[6px] text-[11px] font-bold text-ink-muted uppercase tracking-[0.6px]">
        Crianças
      </Text>

      {isLoading && (
        <Text className="mt-2 mx-[6px] text-[13px] text-ink-muted">Carregando…</Text>
      )}

      {!isLoading && kids.length === 0 && (
        <Text className="mt-2 mx-[6px] text-[13px] text-ink-muted">
          Nenhuma criança vinculada a esta rota.
        </Text>
      )}

      {kids.map((kid) => {
        const state = reduceKidState(events, kid.id);
        const address =
          direction === 'pickup'
            ? kid.pickup_address
            : kid.dropoff_address ?? kid.pickup_address;
        return (
          <KidRow
            key={kid.id}
            kid={kid}
            state={state}
            direction={direction}
            address={address}
            onEvent={(e) => handleEvent(kid.id, e)}
            busy={recordEvent.isPending}
          />
        );
      })}

      <Pressable
        onPress={handleFinish}
        disabled={finish.isPending}
        className="mt-5 py-[14px] rounded-2xl items-center"
        style={{ backgroundColor: `${theme.danger}18`, opacity: finish.isPending ? 0.6 : 1 }}
      >
        <Text className="text-[14px] font-bold" style={{ color: theme.danger }}>
          {finish.isPending ? 'Finalizando…' : 'Finalizar viagem'}
        </Text>
      </Pressable>
    </View>
  );
}

function KidRow({
  kid,
  state,
  direction,
  address,
  onEvent,
  busy,
}: {
  kid: KidOnRoute;
  state: KidState;
  direction: 'pickup' | 'dropoff';
  address: string | null;
  onEvent: (e: TripEventKind) => void;
  busy: boolean;
}) {
  const badge = stateBadge(state);
  const isPickup = direction === 'pickup';
  const primaryEvent: TripEventKind = isPickup ? 'boarded' : 'dropped';
  const primaryLabel = isPickup ? 'Embarcou' : 'Desembarcou';
  const displayShort = kid.short_name ?? kid.full_name;

  return (
    <View
      className="mt-2 p-3 rounded-2xl bg-surface"
      style={{ borderWidth: 1, borderColor: theme.line }}
    >
      <View className="flex-row items-center" style={{ gap: 12 }}>
        <Avatar name={displayShort} size={38} bg={kid.color ?? '#888'} />
        <View className="flex-1">
          <View className="flex-row items-center" style={{ gap: 6, flexWrap: 'wrap' }}>
            <Text className="text-[14px] font-bold text-ink">{kid.full_name}</Text>
            <View
              className="py-[2px] px-2 rounded-full"
              style={{ backgroundColor: badge.bg }}
            >
              <Text
                className="text-[10px] font-bold tracking-[0.3px]"
                style={{ color: badge.fg }}
              >
                {badge.label}
              </Text>
            </View>
            {kid.unregistered && (
              <View
                className="py-[2px] px-2 rounded-full"
                style={{ backgroundColor: `${theme.warm}1A` }}
              >
                <Text
                  className="text-[9px] font-bold tracking-[0.3px]"
                  style={{ color: theme.warm }}
                >
                  NÃO CADASTRADA
                </Text>
              </View>
            )}
          </View>
          {address && (
            <Text className="text-[11px] text-ink-muted mt-[1px]" numberOfLines={1}>
              {address}
            </Text>
          )}
        </View>
      </View>

      <View className="mt-3 flex-row" style={{ gap: 8 }}>
        {state === 'waiting' && (
          <>
            <PressScale
              onPress={() => onEvent(primaryEvent)}
              disabled={busy}
              style={{
                flex: 2,
                padding: 10,
                backgroundColor: theme.success,
                borderRadius: 11,
                alignItems: 'center',
              }}
            >
              <Text className="text-white text-[13px] font-bold">{primaryLabel}</Text>
            </PressScale>
            <Pressable
              onPress={() => onEvent('noshow')}
              disabled={busy}
              className="flex-1 py-[10px] rounded-xl bg-surface-alt items-center"
            >
              <Text className="text-[12px] font-semibold text-ink-muted">Não veio</Text>
            </Pressable>
          </>
        )}
        {state !== 'waiting' && (
          <Pressable
            onPress={() => onEvent('undo')}
            disabled={busy}
            className="flex-1 py-[10px] rounded-xl items-center"
            style={{ borderWidth: 1, borderColor: theme.line }}
          >
            <Text className="text-[12px] font-semibold text-ink-muted">Desfazer</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function stateBadge(state: KidState): { label: string; bg: string; fg: string } {
  switch (state) {
    case 'boarded':
      return { label: 'A BORDO', bg: `${theme.success}1A`, fg: theme.success };
    case 'dropped':
      return { label: 'DESEMBARCOU', bg: `${theme.base}1A`, fg: theme.base };
    case 'noshow':
      return { label: 'NÃO VEIO', bg: `${theme.danger}1A`, fg: theme.danger };
    default:
      return { label: 'AGUARDANDO', bg: theme.surfaceAlt, fg: theme.textMuted };
  }
}

function EmptyState({ message }: { message: string }) {
  return (
    <View
      className="mt-2 p-4 rounded-[18px] bg-surface"
      style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: theme.lineStrong }}
    >
      <Text className="text-[13px] text-ink-muted leading-[18px]">{message}</Text>
    </View>
  );
}
