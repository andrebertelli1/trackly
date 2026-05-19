'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function deleteKid(id: string) {
  await supabase.from('kids').delete().eq('id', id)
  revalidateTag('kids')
  revalidatePath('/kids')
  revalidatePath('/')
}

export async function createKid(formData: FormData) {
  const fullName = formData.get('full_name') as string
  const shortName = (formData.get('short_name') as string) || null
  const grade = formData.get('grade') ? Number(formData.get('grade')) : null
  const color = (formData.get('color') as string) || null
  const routeId = (formData.get('route_id') as string) || null

  const { data: kidId, error } = await supabase.rpc('admin_create_kid', {
    p_full_name: fullName,
    p_short_name: shortName,
    p_grade: grade,
    p_color: color,
  })

  if (error) throw new Error(error.message)

  if (routeId) {
    const { error: assignErr } = await supabase.rpc('admin_assign_kid_to_route', {
      p_kid_id: kidId,
      p_route_id: routeId,
    })
    if (assignErr) throw new Error(assignErr.message)
  }

  revalidateTag('kids')
  revalidatePath('/kids')
  revalidatePath('/')
}

export async function assignKidToRoute(formData: FormData) {
  const kidId = formData.get('kid_id') as string
  const routeId = formData.get('route_id') as string

  const { error } = await supabase.rpc('admin_assign_kid_to_route', {
    p_kid_id: kidId,
    p_route_id: routeId,
  })

  if (error) throw new Error(error.message)
  revalidateTag('kids')
  revalidatePath('/kids')
}
