import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Lazy singleton — deferred so Next.js can import this module during build
// without requiring env vars to be set at that moment.
let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )
  }
  return _client
}

// Server-only client — never import in 'use client' files.
// Uses service role key to bypass RLS for admin operations.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop: string) {
    return (getClient() as unknown as Record<string, unknown>)[prop]
  },
})

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = 'parent' | 'driver' | 'admin'
export type RoutePeriod = 'morning' | 'afternoon'

export interface School {
  id: string
  name: string
  city: string | null
  state?: string | null
  created_at: string
}

export interface Route {
  id: string
  school_id: string
  driver_id: string | null
  van_label: string
  van_color: string | null
  period: RoutePeriod
  pickup_start: string | null
  arrival_time: string | null
  created_at: string
  schools?: { name: string }
  profiles?: { full_name: string | null } | null
}

export interface RouteStop {
  id: string
  route_id: string
  stop_order: number
  address: string
  scheduled_time: string | null
  label: string | null
}

export interface Kid {
  id: string
  full_name: string
  short_name: string | null
  grade: number | null
  color: string | null
  created_at: string
  parent_name?: string
  parent_phone?: string
  parent_kid_links?: { profiles: { full_name: string | null } | null }[]
  kid_route_assignments?: { routes: { van_label: string; van_color?: string; schools: { name: string } } }[]
}

export interface InviteCode {
  code: string
  kid_id: string
  created_by: string | null
  expires_at: string
  max_redemptions: number
  created_at: string
  kids?: { full_name: string }
  redemption_count?: number
}

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  role: UserRole
  email?: string
  since?: string
  status?: string
}
