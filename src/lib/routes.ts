import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useAuth } from './auth';

export type RouteStop = {
  id: string;
  /** Kid id this stop represents (null for the synthesized school destination). */
  kid_id: string | null;
  stop_order: number | null;
  address: string;
  scheduled_time: string | null;
  label: string | null;
  /** Kids picked up / dropped off at this stop. */
  kid_names: string[];
  /** True when this is the synthesized school arrival entry (not a kid). */
  is_destination: boolean;
  /** True when the viewer can't see the kid's PII (other family's kid on the
   *  same route). Renders as "Parada N" with no name/address. */
  is_anonymous: boolean;
};

export type RouteDetail = {
  id: string;
  van_label: string;
  van_color: string | null;
  direction: 'pickup' | 'dropoff';
  pickup_start: string | null;
  arrival_time: string | null;
  driver: {
    id: string;
    full_name: string | null;
  } | null;
  school: {
    id: string;
    name: string;
    city: string | null;
  } | null;
  stops: RouteStop[];
};

/**
 * Full route detail: ordered stops (one per kid on the route) + synthesized
 * school destination + driver + school.
 *
 * Each assignment becomes one stop; the address comes from the kid's
 * pickup_address or dropoff_address depending on the route's period.
 */
export function useRouteDetail(routeId: string | null | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['route', routeId, user?.id],
    enabled: !!user && !!routeId,
    queryFn: async (): Promise<RouteDetail | null> => {
      if (!routeId) return null;

      const { data: route, error: routeErr } = await supabase
        .from('routes')
        .select('id, van_id, direction, pickup_start, arrival_time')
        .eq('id', routeId)
        .maybeSingle();
      if (routeErr) throw routeErr;
      if (!route) return null;

      const { data: van, error: vanErr } = await supabase
        .from('vans')
        .select('id, school_id, van_label, van_color, driver_id')
        .eq('id', route.van_id)
        .maybeSingle();
      if (vanErr) throw vanErr;
      if (!van) return null;

      const [assignmentsRes, schoolRes, driverRes] = await Promise.all([
        supabase
          .from('kid_route_assignments')
          .select('kid_id, stop_order')
          .eq('route_id', routeId),
        supabase
          .from('schools')
          .select('id, name, city')
          .eq('id', van.school_id)
          .maybeSingle(),
        van.driver_id
          ? supabase
              .from('profiles')
              .select('id, full_name')
              .eq('id', van.driver_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (assignmentsRes.error) throw assignmentsRes.error;
      if (schoolRes.error) throw schoolRes.error;
      if (driverRes.error) throw driverRes.error;

      // Fetch kids referenced by these assignments.
      const kidIds = Array.from(
        new Set(
          (assignmentsRes.data ?? [])
            .map((a) => a.kid_id)
            .filter((k): k is string => !!k),
        ),
      );
      const { data: kidRows, error: kidsErr } = kidIds.length
        ? await supabase
            .from('kids')
            .select('id, short_name, full_name, pickup_address, dropoff_address')
            .in('id', kidIds)
        : { data: [], error: null };
      if (kidsErr) throw kidsErr;

      const kidById = new Map((kidRows ?? []).map((k) => [k.id, k]));

      // Build kid stops. Address depends on direction. For kids the viewer
      // can't see (other families on the same route), emit an anonymous stop
      // that still counts toward total + ordering.
      const isDropoff = route.direction === 'dropoff';
      const kidStops: RouteStop[] = [];
      for (const a of assignmentsRes.data ?? []) {
        const kid = kidById.get(a.kid_id);
        if (!kid) {
          kidStops.push({
            id: `${a.kid_id}:${routeId}`,
            kid_id: a.kid_id,
            stop_order: a.stop_order ?? null,
            address: '',
            scheduled_time: null,
            label: null,
            kid_names: [],
            is_destination: false,
            is_anonymous: true,
          });
          continue;
        }
        const address = isDropoff
          ? kid.dropoff_address ?? kid.pickup_address ?? ''
          : kid.pickup_address ?? '';
        const label = kid.short_name ?? kid.full_name;
        kidStops.push({
          id: `${a.kid_id}:${routeId}`,
          kid_id: a.kid_id,
          stop_order: a.stop_order ?? null,
          address,
          scheduled_time: null,
          label,
          kid_names: [label],
          is_destination: false,
          is_anonymous: false,
        });
      }
      kidStops.sort((a, b) => {
        const ao = a.stop_order ?? Number.MAX_SAFE_INTEGER;
        const bo = b.stop_order ?? Number.MAX_SAFE_INTEGER;
        if (ao !== bo) return ao - bo;
        return (a.label ?? '').localeCompare(b.label ?? '');
      });

      // Synthesize the school entry at the end (morning arrival) or start (afternoon origin).
      const schoolEntry: RouteStop | null = schoolRes.data
        ? {
            id: `school:${routeId}`,
            kid_id: null,
            stop_order: null,
            address: schoolRes.data.name,
            scheduled_time: route.arrival_time,
            label: 'Chegada',
            kid_names: [],
            is_destination: true,
            is_anonymous: false,
          }
        : null;

      // Pickup routes end at the school (school last). Dropoff routes start
      // at the school (school first).
      const stops: RouteStop[] = schoolEntry
        ? isDropoff
          ? [schoolEntry, ...kidStops]
          : [...kidStops, schoolEntry]
        : kidStops;

      return {
        id: route.id,
        van_label: van.van_label,
        van_color: van.van_color,
        direction: route.direction,
        pickup_start: route.pickup_start,
        arrival_time: route.arrival_time,
        driver: van.driver_id
          ? {
              id: van.driver_id,
              full_name: driverRes.data?.full_name ?? null,
            }
          : null,
        school: schoolRes.data
          ? {
              id: schoolRes.data.id,
              name: schoolRes.data.name,
              city: schoolRes.data.city,
            }
          : null,
        stops,
      };
    },
  });
}
