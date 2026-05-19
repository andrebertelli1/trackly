import { unstable_cache } from 'next/cache'
import { supabase } from './supabase'
import { mockSchools, mockRoutes, mockKids, mockDrivers, mockPromotionCandidates, mockInviteCodes } from './mock'
import type { School, Route, Kid, Profile } from './supabase'

// ─── Schools ─────────────────────────────────────────────────────────────────

export const getSchools = unstable_cache(
  async (): Promise<School[]> => {
    try {
      const { data, error } = await supabase.from('schools').select('*').order('name')
      if (error) throw error
      return data ?? []
    } catch {
      return mockSchools
    }
  },
  ['schools'],
  { tags: ['schools'], revalidate: 60 },
)

// ─── Routes ──────────────────────────────────────────────────────────────────

export const getRoutesWithDetails = unstable_cache(
  async (): Promise<Route[]> => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*, schools(name), profiles(full_name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Route[]
    } catch {
      return mockRoutes
    }
  },
  ['routes-with-details'],
  { tags: ['routes'], revalidate: 60 },
)

export const getRoutesBasic = unstable_cache(
  async (): Promise<Route[]> => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('id, school_id, driver_id, van_label, van_color, period, pickup_start, arrival_time, created_at, schools(name)')
        .order('van_label')
      if (error) throw error
      return (data ?? []) as unknown as Route[]
    } catch {
      return mockRoutes
    }
  },
  ['routes-basic'],
  { tags: ['routes'], revalidate: 60 },
)

// ─── Profiles ────────────────────────────────────────────────────────────────

export const getDriverProfiles = unstable_cache(
  async (): Promise<Profile[]> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, role')
        .eq('role', 'driver')
        .order('full_name')
      if (error) throw error
      return (data ?? []) as Profile[]
    } catch {
      return mockDrivers
    }
  },
  ['driver-profiles'],
  { tags: ['drivers'], revalidate: 60 },
)

export const getDriverCandidates = unstable_cache(
  async (): Promise<Profile[]> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, role')
        .neq('role', 'driver')
        .order('full_name')
      if (error) throw error
      return (data ?? []) as Profile[]
    } catch {
      return mockPromotionCandidates
    }
  },
  ['driver-candidates'],
  { tags: ['drivers'], revalidate: 60 },
)

// ─── Kids ─────────────────────────────────────────────────────────────────────

export const getKidsWithAssignments = unstable_cache(
  async (): Promise<Kid[]> => {
    try {
      const { data, error } = await supabase
        .from('kids')
        .select('*, kid_route_assignments(routes(van_label, van_color, schools(name)))')
        .order('full_name')
      if (error) throw error
      return (data ?? []) as unknown as Kid[]
    } catch {
      return mockKids
    }
  },
  ['kids-with-assignments'],
  { tags: ['kids'], revalidate: 60 },
)

export const getKidsBasic = unstable_cache(
  async (): Promise<Kid[]> => {
    try {
      const { data, error } = await supabase
        .from('kids')
        .select('id, full_name, short_name, grade, color, created_at')
        .order('full_name')
      if (error) throw error
      return (data ?? []) as Kid[]
    } catch {
      return mockKids
    }
  },
  ['kids-basic'],
  { tags: ['kids'], revalidate: 60 },
)

// ─── Invite Codes ─────────────────────────────────────────────────────────────

export interface InviteCodeRow {
  code: string
  expires_at: string
  max_redemptions: number
  created_at: string
  kids: { full_name: string } | null
  redemption_count: number
  status: string
}

export const getInviteCodesWithRedemptions = unstable_cache(
  async (): Promise<InviteCodeRow[]> => {
    try {
      // All 3 queries in parallel — no sequential waterfall
      const [codesRes, redemptionsRes] = await Promise.all([
        supabase
          .from('invite_codes')
          .select('code, expires_at, max_redemptions, created_at, kids(full_name)')
          .order('created_at', { ascending: false }),
        supabase.from('invite_redemptions').select('code'),
      ])
      if (codesRes.error) throw codesRes.error

      const countMap: Record<string, number> = {}
      for (const r of redemptionsRes.data ?? []) countMap[r.code] = (countMap[r.code] ?? 0) + 1

      const now = new Date()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (codesRes.data ?? []).map((c: any) => {
        const uses = countMap[c.code] ?? 0
        const expired = new Date(c.expires_at) <= now
        const full = uses >= c.max_redemptions
        return {
          code: c.code,
          expires_at: c.expires_at,
          max_redemptions: c.max_redemptions,
          created_at: c.created_at,
          kids: Array.isArray(c.kids) ? (c.kids[0] ?? null) : c.kids,
          redemption_count: uses,
          status: expired ? 'Expired' : full ? 'Exhausted' : 'Active',
        }
      })
    } catch {
      const now = new Date()
      return mockInviteCodes.map(c => ({
        code: c.code,
        expires_at: c.expires_at,
        max_redemptions: c.max_redemptions,
        created_at: c.created_at,
        kids: { full_name: c.route_label ?? c.kids?.full_name ?? '—' },
        redemption_count: c.redemption_count ?? 0,
        status: c.status ?? 'Active',
      }))
    }
  },
  ['invite-codes'],
  { tags: ['invite-codes'], revalidate: 60 },
)

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const getDashboardStats = unstable_cache(
  async () => {
    try {
      const [schools, routes, kids, drivers] = await Promise.all([
        supabase.from('schools').select('id', { count: 'exact', head: true }),
        supabase.from('routes').select('id', { count: 'exact', head: true }),
        supabase.from('kids').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'driver'),
      ])
      if (schools.error) throw schools.error
      return {
        schools: schools.count ?? 0,
        routes: routes.count ?? 0,
        students: kids.count ?? 0,
        drivers: drivers.count ?? 0,
      }
    } catch {
      return {
        schools: mockSchools.length,
        routes: mockRoutes.length,
        students: mockKids.length,
        drivers: mockDrivers.length,
      }
    }
  },
  ['dashboard-stats'],
  { tags: ['schools', 'routes', 'kids', 'drivers'], revalidate: 60 },
)

export const getDashboardRecentRoutes = unstable_cache(
  async () => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*, schools(name), profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(6)
      if (error) throw error
      return data ?? []
    } catch {
      return mockRoutes.slice(0, 6)
    }
  },
  ['dashboard-recent-routes'],
  { tags: ['routes'], revalidate: 60 },
)

export const getDashboardSchools = unstable_cache(
  async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name, city')
        .order('name')
        .limit(5)
      if (error) throw error
      return data ?? []
    } catch {
      return mockSchools.slice(0, 5)
    }
  },
  ['dashboard-schools'],
  { tags: ['schools'], revalidate: 60 },
)

export const getDashboardRecentCodes = unstable_cache(
  async () => {
    try {
      const { data, error } = await supabase
        .from('invite_codes')
        .select('code, expires_at, max_redemptions, created_at')
        .order('created_at', { ascending: false })
        .limit(4)
      if (error) throw error
      return data ?? []
    } catch {
      return mockInviteCodes.slice(0, 4)
    }
  },
  ['dashboard-recent-codes'],
  { tags: ['invite-codes'], revalidate: 60 },
)
