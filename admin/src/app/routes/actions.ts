'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath, revalidateTag } from 'next/cache'
import type { RoutePeriod } from '@/lib/supabase'

export async function deleteRoute(id: string) {
  await supabase.from('routes').delete().eq('id', id)
  revalidateTag('routes')
  revalidatePath('/routes')
  revalidatePath('/')
}

export async function createRoute(formData: FormData) {
  const schoolId = formData.get('school_id') as string
  const vanLabel = formData.get('van_label') as string
  const period = formData.get('period') as RoutePeriod
  const driverId = (formData.get('driver_id') as string) || null
  const vanColor = (formData.get('van_color') as string) || null
  const pickupStart = (formData.get('pickup_start') as string) || null
  const arrivalTime = (formData.get('arrival_time') as string) || null

  // Raw stops JSON encoded by the client form
  const stopsRaw = formData.get('stops') as string
  const stops: { address: string; scheduled_time: string; label: string }[] = stopsRaw
    ? JSON.parse(stopsRaw)
    : []

  const { data: routeId, error } = await supabase.rpc('admin_create_route', {
    p_school_id: schoolId,
    p_van_label: vanLabel,
    p_period: period,
    p_driver_id: driverId,
    p_van_color: vanColor,
    p_pickup_start: pickupStart || null,
    p_arrival_time: arrivalTime || null,
  })

  if (error) throw new Error(error.message)

  for (let i = 0; i < stops.length; i++) {
    const s = stops[i]
    if (!s.address.trim()) continue
    const { error: stopErr } = await supabase.rpc('admin_add_route_stop', {
      p_route_id: routeId,
      p_stop_order: i + 1,
      p_address: s.address,
      p_scheduled_time: s.scheduled_time || null,
      p_label: s.label || null,
    })
    if (stopErr) throw new Error(stopErr.message)
  }

  revalidateTag('routes')
  revalidatePath('/routes')
  revalidatePath('/')
}
