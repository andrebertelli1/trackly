'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function deleteSchool(id: string) {
  await supabase.from('schools').delete().eq('id', id)
  revalidateTag('schools')
  revalidatePath('/schools')
  revalidatePath('/')
}

export async function createSchool(formData: FormData) {
  const name = formData.get('name') as string
  const city = (formData.get('city') as string) || null

  const { error } = await supabase.rpc('admin_create_school', {
    p_name: name,
    p_city: city,
  })

  if (error) throw new Error(error.message)
  revalidateTag('schools')
  revalidatePath('/schools')
  revalidatePath('/')
}
