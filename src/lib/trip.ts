import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';
import { queryClient } from './queryClient';
import { useAuth } from './auth';

export type TripEventKind = 'boarded' | 'dropped' | 'noshow' | 'undo';
export type KidState = 'waiting' | 'boarded' | 'dropped' | 'noshow';

export type TripEvent = {
  id: string;
  kid_id: string;
  event: TripEventKind;
  created_at: string;
};

export type ActiveTrip = {
  id: string;
  route_id: string;
  started_at: string;
  events: TripEvent[];
};

/** Reduce a kid's event log into a single current state. */
export function reduceKidState(events: TripEvent[], kidId: string): KidState {
  const log = events.filter((e) => e.kid_id === kidId);
  const last = log.length > 0 ? log[log.length - 1] : null;
  if (!last || last.event === 'undo') return 'waiting';
  if (last.event === 'boarded') return 'boarded';
  if (last.event === 'dropped') return 'dropped';
  return 'noshow';
}

/**
 * Returns the current in-progress trip for a route + its events. Polls every
 * 10s so the parent sees driver-side changes without Realtime.
 */
export function useActiveTrip(routeId: string | null | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['active-trip', routeId, user?.id],
    enabled: !!user && !!routeId,
    refetchInterval: 10_000,
    queryFn: async (): Promise<ActiveTrip | null> => {
      if (!routeId) return null;
      const { data: trip, error: tripErr } = await supabase
        .from('trips')
        .select('id, route_id, started_at')
        .eq('route_id', routeId)
        .eq('status', 'in_progress')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (tripErr) throw tripErr;
      if (!trip) return null;

      const { data: events, error: eErr } = await supabase
        .from('trip_kid_events')
        .select('id, kid_id, event, created_at')
        .eq('trip_id', trip.id)
        .order('created_at', { ascending: true });
      if (eErr) throw eErr;

      return {
        id: trip.id,
        route_id: trip.route_id,
        started_at: trip.started_at,
        events: (events ?? []) as TripEvent[],
      };
    },
  });
}

/**
 * Returns all in-progress trips whose routes the current driver owns, with
 * their events. Single query — call this once in the driver Check-in screen
 * instead of one useActiveTrip per route (which would violate hook rules).
 */
export function useMyActiveTrips() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-active-trips', user?.id],
    enabled: !!user,
    refetchInterval: 10_000,
    queryFn: async (): Promise<ActiveTrip[]> => {
      if (!user) return [];
      // Driver's vans → routes → trips (RLS filters to drivable routes).
      const { data: trips, error: tErr } = await supabase
        .from('trips')
        .select('id, route_id, started_at')
        .eq('status', 'in_progress')
        .order('started_at', { ascending: false });
      if (tErr) throw tErr;
      if (!trips || trips.length === 0) return [];

      const ids = trips.map((t) => t.id);
      const { data: events, error: eErr } = await supabase
        .from('trip_kid_events')
        .select('id, trip_id, kid_id, event, created_at')
        .in('trip_id', ids)
        .order('created_at', { ascending: true });
      if (eErr) throw eErr;
      const eventsByTrip = new Map<string, TripEvent[]>();
      for (const e of events ?? []) {
        const arr = eventsByTrip.get(e.trip_id) ?? [];
        arr.push({
          id: e.id,
          kid_id: e.kid_id,
          event: e.event,
          created_at: e.created_at,
        });
        eventsByTrip.set(e.trip_id, arr);
      }

      return trips.map((t) => ({
        id: t.id,
        route_id: t.route_id,
        started_at: t.started_at,
        events: eventsByTrip.get(t.id) ?? [],
      }));
    },
  });
}

/** Kids assigned to a route (driver-facing). */
export type KidOnRoute = {
  id: string;
  full_name: string;
  short_name: string | null;
  color: string | null;
  pickup_address: string | null;
  dropoff_address: string | null;
  /** True when the driver added this kid directly (no parent in the app). */
  unregistered: boolean;
};

export function useKidsOnRoute(routeId: string | null | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['kids-on-route', routeId, user?.id],
    enabled: !!user && !!routeId,
    queryFn: async (): Promise<KidOnRoute[]> => {
      if (!routeId) return [];
      const { data: assignments, error: aErr } = await supabase
        .from('kid_route_assignments')
        .select('kid_id, stop_order')
        .eq('route_id', routeId);
      if (aErr) throw aErr;
      const kidIds = (assignments ?? []).map((a) => a.kid_id);
      if (kidIds.length === 0) return [];

      const { data: kids, error: kErr } = await supabase
        .from('kids')
        .select('id, full_name, short_name, color, pickup_address, dropoff_address, parent_id')
        .in('id', kidIds);
      if (kErr) throw kErr;

      const orderById = new Map(
        (assignments ?? []).map((a) => [a.kid_id, a.stop_order ?? Number.MAX_SAFE_INTEGER]),
      );
      return (kids ?? [])
        .map((k) => ({
          id: k.id,
          full_name: k.full_name,
          short_name: k.short_name,
          color: k.color,
          pickup_address: k.pickup_address,
          dropoff_address: k.dropoff_address,
          unregistered: !k.parent_id,
        }))
        .sort((a, b) => {
          const ao = orderById.get(a.id) ?? Number.MAX_SAFE_INTEGER;
          const bo = orderById.get(b.id) ?? Number.MAX_SAFE_INTEGER;
          if (ao !== bo) return ao - bo;
          return (a.short_name ?? a.full_name).localeCompare(b.short_name ?? b.full_name);
        });
    },
  });
}

export function useStartTrip() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (routeId: string): Promise<string> => {
      const { data, error } = await supabase.rpc('driver_start_trip', {
        p_route_id: routeId,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (_id, routeId) => {
      queryClient.invalidateQueries({ queryKey: ['active-trip', routeId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['my-vans', user?.id] });
    },
  });
}

export function useFinishTrip() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (tripId: string) => {
      const { error } = await supabase.rpc('driver_finish_trip', { p_trip_id: tripId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-trip'] });
      queryClient.invalidateQueries({ queryKey: ['my-vans', user?.id] });
    },
  });
}

export function useRecordKidEvent() {
  return useMutation({
    mutationFn: async (params: {
      trip_id: string;
      kid_id: string;
      event: TripEventKind;
    }) => {
      const { error } = await supabase.from('trip_kid_events').insert({
        trip_id: params.trip_id,
        kid_id: params.kid_id,
        event: params.event,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-trip'] });
    },
  });
}
