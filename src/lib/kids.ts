import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';
import { queryClient } from './queryClient';
import { useAuth } from './auth';

export type MyKid = {
  id: string;
  full_name: string;
  short_name: string | null;
  grade: number | null;
  color: string | null;
  pickup_address: string | null;
  dropoff_address: string | null;
  route: {
    id: string;
    van_label: string;
    van_color: string | null;
    period: 'morning' | 'afternoon';
    pickup_start: string | null;
    arrival_time: string | null;
    driver_id: string | null;
    driver_name: string | null;
    school: {
      id: string;
      name: string;
      city: string | null;
    } | null;
  } | null;
  /** Where the van picks up / drops off this kid on this route, derived from
   *  the kid's address fields + the route's period. */
  pickup: {
    address: string | null;
    scheduled_time: string | null;
  } | null;
};

/**
 * The parent's kids. Kids without any route assignment are still returned
 * (with `route` and `pickup` set to null) so the Profile screen can list them
 * before they're linked to a van. One row per (kid, route) pair.
 */
export function useMyKids() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-kids', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<MyKid[]> => {
      if (!user) return [];

      // 1. Kids owned by this parent.
      const { data: kidRows, error: kidsErr } = await supabase
        .from('kids')
        .select('id, full_name, short_name, grade, color, pickup_address, dropoff_address')
        .eq('parent_id', user.id);
      if (kidsErr) throw kidsErr;
      const kids = kidRows ?? [];
      if (kids.length === 0) return [];

      const kidIds = kids.map((k) => k.id);

      // 2. Assignments for those kids.
      const { data: assignments, error: aErr } = await supabase
        .from('kid_route_assignments')
        .select('kid_id, route_id, stop_order')
        .in('kid_id', kidIds);
      if (aErr) throw aErr;

      const routeIds = Array.from(new Set((assignments ?? []).map((a) => a.route_id)));

      // 3. Routes + schools + drivers.
      const { data: routeRows, error: rErr } = routeIds.length
        ? await supabase
            .from('routes')
            .select(
              'id, school_id, van_label, van_color, period, pickup_start, arrival_time, driver_id',
            )
            .in('id', routeIds)
        : { data: [], error: null };
      if (rErr) throw rErr;

      const schoolIds = Array.from(
        new Set((routeRows ?? []).map((r) => r.school_id).filter(Boolean)),
      );
      const { data: schoolRows, error: schErr } = schoolIds.length
        ? await supabase.from('schools').select('id, name, city').in('id', schoolIds)
        : { data: [], error: null };
      if (schErr) throw schErr;

      const driverIds = Array.from(
        new Set(
          (routeRows ?? [])
            .map((r) => r.driver_id)
            .filter((d): d is string => !!d),
        ),
      );
      const { data: driverRows, error: dErr } = driverIds.length
        ? await supabase.from('profiles').select('id, full_name').in('id', driverIds)
        : { data: [], error: null };
      if (dErr) throw dErr;

      // 4. Merge.
      const routesById = new Map((routeRows ?? []).map((r) => [r.id, r]));
      const schoolsById = new Map((schoolRows ?? []).map((s) => [s.id, s]));
      const driversById = new Map((driverRows ?? []).map((d) => [d.id, d]));

      const flat: MyKid[] = [];
      const assignedKidIds = new Set<string>();

      for (const a of assignments ?? []) {
        const kid = kids.find((k) => k.id === a.kid_id);
        if (!kid) continue;
        assignedKidIds.add(kid.id);
        const route = routesById.get(a.route_id) ?? null;
        const school = route ? schoolsById.get(route.school_id) ?? null : null;
        const driver = route?.driver_id ? driversById.get(route.driver_id) ?? null : null;

        // Pickup address = embarque field for morning, dropoff for afternoon
        // (fallback to pickup if dropoff is null).
        const pickupAddress = route
          ? route.period === 'morning'
            ? kid.pickup_address
            : kid.dropoff_address ?? kid.pickup_address
          : null;

        flat.push({
          id: kid.id,
          full_name: kid.full_name,
          short_name: kid.short_name,
          grade: kid.grade,
          color: kid.color,
          pickup_address: kid.pickup_address,
          dropoff_address: kid.dropoff_address,
          route: route
            ? {
                id: route.id,
                van_label: route.van_label,
                van_color: route.van_color,
                period: route.period,
                pickup_start: route.pickup_start,
                arrival_time: route.arrival_time,
                driver_id: route.driver_id,
                driver_name: driver?.full_name ?? null,
                school: school
                  ? { id: school.id, name: school.name, city: school.city }
                  : null,
              }
            : null,
          pickup: route
            ? {
                address: pickupAddress,
                scheduled_time: null, // per-kid time not modeled yet
              }
            : null,
        });
      }

      // Kids without any assignment yet.
      for (const kid of kids) {
        if (assignedKidIds.has(kid.id)) continue;
        flat.push({
          id: kid.id,
          full_name: kid.full_name,
          short_name: kid.short_name,
          grade: kid.grade,
          color: kid.color,
          pickup_address: kid.pickup_address,
          dropoff_address: kid.dropoff_address,
          route: null,
          pickup: null,
        });
      }

      flat.sort((a, b) => {
        const periodOrder = (p: string | undefined) => (p === 'morning' ? 0 : 1);
        const ap = periodOrder(a.route?.period);
        const bp = periodOrder(b.route?.period);
        if (ap !== bp) return ap - bp;
        return (a.full_name ?? '').localeCompare(b.full_name ?? '');
      });
      return flat;
    },
  });
}

export type CreateKidInput = {
  full_name: string;
  short_name?: string | null;
  grade?: number | null;
  color?: string | null;
  pickup_address: string;
  dropoff_address?: string | null;
};

/** Inserts a kid owned by the current user. */
export function useCreateKid() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: CreateKidInput) => {
      if (!user) throw new Error('Faça login antes de adicionar uma criança.');
      const { data, error } = await supabase
        .from('kids')
        .insert({
          parent_id: user.id,
          full_name: input.full_name.trim(),
          short_name: input.short_name?.trim() || null,
          grade: input.grade ?? null,
          color: input.color ?? null,
          pickup_address: input.pickup_address.trim(),
          dropoff_address: input.dropoff_address?.trim() || null,
        })
        .select('id, full_name, short_name, grade, color, pickup_address, dropoff_address')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-kids', user?.id] });
    },
  });
}
