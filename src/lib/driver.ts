import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';
import { queryClient } from './queryClient';
import { useAuth } from './auth';

export type VanRoute = {
  id: string;
  direction: 'pickup' | 'dropoff';
  pickup_start: string | null;
  arrival_time: string | null;
};

export type DriverVan = {
  id: string;
  van_label: string;
  van_color: string | null;
  school: { id: string; name: string; city: string | null } | null;
  routes: VanRoute[];
  invite_codes: {
    code: string;
    expires_at: string;
    max_redemptions: number;
    redemptions_used: number;
  }[];
  /** Distinct kids linked to any route of this van. */
  kid_count: number;
};

/** Vans the current driver owns, with routes + codes + linked-kid counts. */
export function useMyVans() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-vans', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<DriverVan[]> => {
      if (!user) return [];

      const { data: vans, error: vErr } = await supabase
        .from('vans')
        .select('id, school_id, van_label, van_color')
        .eq('driver_id', user.id);
      if (vErr) throw vErr;
      if (!vans || vans.length === 0) return [];

      const vanIds = vans.map((v) => v.id);
      const schoolIds = Array.from(new Set(vans.map((v) => v.school_id)));

      const [routesRes, codesRes, schoolsRes] = await Promise.all([
        supabase
          .from('routes')
          .select('id, van_id, direction, pickup_start, arrival_time')
          .in('van_id', vanIds),
        supabase
          .from('invite_codes')
          .select('code, van_id, expires_at, max_redemptions')
          .in('van_id', vanIds),
        supabase.from('schools').select('id, name, city').in('id', schoolIds),
      ]);
      if (routesRes.error) throw routesRes.error;
      if (codesRes.error) throw codesRes.error;
      if (schoolsRes.error) throw schoolsRes.error;

      const routesByVan = new Map<string, VanRoute[]>();
      const routeIds: string[] = [];
      for (const r of routesRes.data ?? []) {
        const arr = routesByVan.get(r.van_id) ?? [];
        arr.push({
          id: r.id,
          direction: r.direction,
          pickup_start: r.pickup_start,
          arrival_time: r.arrival_time,
        });
        routesByVan.set(r.van_id, arr);
        routeIds.push(r.id);
      }
      for (const arr of routesByVan.values()) {
        arr.sort((a, b) => (a.direction === 'pickup' ? 0 : 1) - (b.direction === 'pickup' ? 0 : 1));
      }

      // Pull redemption counts for those codes.
      const codes = codesRes.data ?? [];
      const codeStrings = codes.map((c) => c.code);
      const { data: redemptions, error: redErr } = codeStrings.length
        ? await supabase.from('invite_redemptions').select('code').in('code', codeStrings)
        : { data: [], error: null };
      if (redErr) throw redErr;
      const redemptionsByCode = new Map<string, number>();
      for (const r of redemptions ?? []) {
        redemptionsByCode.set(r.code, (redemptionsByCode.get(r.code) ?? 0) + 1);
      }

      // Distinct kid count per van (via kid_route_assignments → routes → van).
      const { data: assigns, error: aErr } = routeIds.length
        ? await supabase
            .from('kid_route_assignments')
            .select('route_id, kid_id')
            .in('route_id', routeIds)
        : { data: [], error: null };
      if (aErr) throw aErr;
      const routeToVan = new Map<string, string>();
      for (const r of routesRes.data ?? []) routeToVan.set(r.id, r.van_id);
      const kidsByVan = new Map<string, Set<string>>();
      for (const a of assigns ?? []) {
        const vanId = routeToVan.get(a.route_id);
        if (!vanId) continue;
        const set = kidsByVan.get(vanId) ?? new Set<string>();
        set.add(a.kid_id);
        kidsByVan.set(vanId, set);
      }

      const schoolsById = new Map((schoolsRes.data ?? []).map((s) => [s.id, s]));

      return vans.map((v) => ({
        id: v.id,
        van_label: v.van_label,
        van_color: v.van_color,
        school: schoolsById.get(v.school_id)
          ? {
              id: schoolsById.get(v.school_id)!.id,
              name: schoolsById.get(v.school_id)!.name,
              city: schoolsById.get(v.school_id)!.city,
            }
          : null,
        routes: routesByVan.get(v.id) ?? [],
        invite_codes: codes
          .filter((c) => c.van_id === v.id)
          .map((c) => ({
            code: c.code,
            expires_at: c.expires_at,
            max_redemptions: c.max_redemptions,
            redemptions_used: redemptionsByCode.get(c.code) ?? 0,
          }))
          .sort((a, b) => a.expires_at.localeCompare(b.expires_at)),
        kid_count: kidsByVan.get(v.id)?.size ?? 0,
      }));
    },
  });
}

export type CreateVanInput = {
  school_name: string;
  school_city?: string | null;
  van_label: string;
  van_color?: string | null;
  pickup?: { pickup_start: string | null; arrival_time: string | null } | null;
  dropoff?: { pickup_start: string | null; arrival_time: string | null } | null;
};

/** Upsert school + van + at least one route in one atomic-ish workflow. */
export function useCreateVan() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: CreateVanInput) => {
      const { data: schoolId, error: schoolErr } = await supabase.rpc(
        'driver_upsert_school',
        { p_name: input.school_name, p_city: input.school_city ?? null },
      );
      if (schoolErr) throw schoolErr;

      const { data: vanId, error: vanErr } = await supabase.rpc('driver_upsert_van', {
        p_school_id: schoolId,
        p_van_label: input.van_label,
        p_van_color: input.van_color ?? null,
      });
      if (vanErr) throw vanErr;

      if (input.pickup) {
        const { error: e1 } = await supabase.rpc('driver_add_route_to_van', {
          p_van_id: vanId,
          p_direction: 'pickup',
          p_pickup_start: input.pickup.pickup_start,
          p_arrival_time: input.pickup.arrival_time,
        });
        if (e1) throw e1;
      }
      if (input.dropoff) {
        const { error: e2 } = await supabase.rpc('driver_add_route_to_van', {
          p_van_id: vanId,
          p_direction: 'dropoff',
          p_pickup_start: input.dropoff.pickup_start,
          p_arrival_time: input.dropoff.arrival_time,
        });
        if (e2) throw e2;
      }

      return { schoolId: schoolId as string, vanId: vanId as string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-vans', user?.id] });
    },
  });
}

/** Add a missing direction to an existing van. Auto-links kids already on the van. */
export function useAddDirectionToVan() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (params: {
      van_id: string;
      direction: 'pickup' | 'dropoff';
      pickup_start: string | null;
      arrival_time: string | null;
    }) => {
      const { error } = await supabase.rpc('driver_add_route_to_van', {
        p_van_id: params.van_id,
        p_direction: params.direction,
        p_pickup_start: params.pickup_start,
        p_arrival_time: params.arrival_time,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-vans', user?.id] });
    },
  });
}

export function useGenerateInviteCode() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (params: {
      van_id: string;
      expires_in_days?: number;
      max_redemptions?: number;
    }) => {
      const { data, error } = await supabase.rpc('driver_generate_invite_code', {
        p_van_id: params.van_id,
        p_expires_in_days: params.expires_in_days ?? 30,
        p_max_redemptions: params.max_redemptions ?? 20,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-vans', user?.id] });
    },
  });
}

export function useUpdateVan() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (params: {
      van_id: string;
      van_label?: string | null;
      van_color?: string | null;
    }) => {
      const { error } = await supabase.rpc('driver_update_van', {
        p_van_id: params.van_id,
        p_van_label: params.van_label ?? null,
        p_van_color: params.van_color ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-vans', user?.id] });
    },
  });
}

export type KidOnVan = {
  id: string;
  full_name: string;
  short_name: string | null;
  grade: number | null;
  color: string | null;
  pickup_address: string | null;
  dropoff_address: string | null;
  parent_name: string | null;
  /** True for kids the driver added directly (parent never joined the app). */
  unregistered: boolean;
};

/** Distinct kids attached to any route of the van. */
export function useKidsOnVan(vanId: string | null | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['kids-on-van', vanId, user?.id],
    enabled: !!user && !!vanId,
    queryFn: async (): Promise<KidOnVan[]> => {
      if (!vanId) return [];
      // Routes of this van.
      const { data: routes, error: rErr } = await supabase
        .from('routes')
        .select('id')
        .eq('van_id', vanId);
      if (rErr) throw rErr;
      const routeIds = (routes ?? []).map((r) => r.id);
      if (routeIds.length === 0) return [];

      const { data: assigns, error: aErr } = await supabase
        .from('kid_route_assignments')
        .select('kid_id')
        .in('route_id', routeIds);
      if (aErr) throw aErr;
      const kidIds = Array.from(new Set((assigns ?? []).map((a) => a.kid_id)));
      if (kidIds.length === 0) return [];

      const { data: kids, error: kErr } = await supabase
        .from('kids')
        .select('id, full_name, short_name, grade, color, pickup_address, dropoff_address, parent_id')
        .in('id', kidIds);
      if (kErr) throw kErr;

      const parentIds = Array.from(
        new Set((kids ?? []).map((k) => k.parent_id).filter((p): p is string => !!p)),
      );
      const { data: parents, error: pErr } = parentIds.length
        ? await supabase.from('profiles').select('id, full_name').in('id', parentIds)
        : { data: [], error: null };
      if (pErr) throw pErr;
      const parentNameById = new Map(
        (parents ?? []).map((p) => [p.id, p.full_name as string | null]),
      );

      return (kids ?? [])
        .map((k) => ({
          id: k.id,
          full_name: k.full_name,
          short_name: k.short_name,
          grade: k.grade,
          color: k.color,
          pickup_address: k.pickup_address,
          dropoff_address: k.dropoff_address,
          parent_name: k.parent_id ? parentNameById.get(k.parent_id) ?? null : null,
          unregistered: !k.parent_id,
        }))
        .sort((a, b) => (a.short_name ?? a.full_name).localeCompare(b.short_name ?? b.full_name));
    },
  });
}

export type AddUnregisteredKidInput = {
  van_id: string;
  full_name: string;
  pickup_address: string;
  short_name?: string | null;
  dropoff_address?: string | null;
  grade?: number | null;
  color?: string | null;
};

export function useAddUnregisteredKid() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: AddUnregisteredKidInput) => {
      const { data, error } = await supabase.rpc('driver_add_unregistered_kid', {
        p_van_id: input.van_id,
        p_full_name: input.full_name,
        p_pickup_address: input.pickup_address,
        p_short_name: input.short_name ?? null,
        p_dropoff_address: input.dropoff_address ?? null,
        p_grade: input.grade ?? null,
        p_color: input.color ?? null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (_id, input) => {
      queryClient.invalidateQueries({ queryKey: ['kids-on-van', input.van_id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['kids-on-route'] });
      queryClient.invalidateQueries({ queryKey: ['my-vans', user?.id] });
    },
  });
}

export function useDeleteUnregisteredKid() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (kidId: string) => {
      const { error } = await supabase.rpc('driver_delete_unregistered_kid', {
        p_kid_id: kidId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kids-on-van'] });
      queryClient.invalidateQueries({ queryKey: ['kids-on-route'] });
      queryClient.invalidateQueries({ queryKey: ['my-vans', user?.id] });
    },
  });
}

export function useRevokeInviteCode() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (code: string) => {
      const { error } = await supabase.rpc('driver_revoke_invite_code', { p_code: code });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-vans', user?.id] });
    },
  });
}
