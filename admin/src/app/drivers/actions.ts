'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function promoteToDriver(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ role: 'driver' })
    .eq('id', userId)

  if (error) throw new Error(error.message)
  revalidateTag('drivers')
  revalidatePath('/drivers')
}

export async function demoteDriver(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ role: 'parent' })
    .eq('id', userId)

  if (error) throw new Error(error.message)
  revalidateTag('drivers')
  revalidatePath('/drivers')
}
