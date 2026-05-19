'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath, revalidateTag } from 'next/cache'

function genCode(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function generateInviteCode(formData: FormData) {
  const kidId = formData.get('kid_id') as string
  const expiresInDays = Number(formData.get('expires_in_days') ?? 14)
  const maxRedemptions = Number(formData.get('max_redemptions') ?? 2)

  if (!kidId) throw new Error('Student is required')

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  const { error } = await supabase.from('invite_codes').insert({
    code: genCode(),
    kid_id: kidId,
    expires_at: expiresAt.toISOString(),
    max_redemptions: maxRedemptions,
  })

  if (error) throw new Error(error.message)
  revalidateTag('invite-codes')
  revalidatePath('/invite-codes')
}

export async function revokeCode(code: string) {
  const { error } = await supabase
    .from('invite_codes')
    .delete()
    .eq('code', code)

  if (error) throw new Error(error.message)
  revalidateTag('invite-codes')
  revalidatePath('/invite-codes')
}
