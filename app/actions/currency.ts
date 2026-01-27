'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getSmazeBalance() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated', balance: 0 }
  }

  const { data, error } = await supabase
    .from('player_stats')
    .select('smaze')
    .eq('user_id', user.id)
    .single()

  if (error) {
    return { error: error.message, balance: 0 }
  }

  return { balance: data?.smaze || 2000 }
}

export async function updateSmaze(amountChange: number) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated', balance: 0 }
  }

  // Call the update_smaze function
  const { data, error } = await supabase.rpc('update_smaze', {
    p_user_id: user.id,
    amount_change: amountChange
  })

  if (error) {
    return { error: error.message, balance: 0 }
  }

  revalidatePath('/games/matromat')
  revalidatePath('/profile')
  
  return { balance: data?.[0] || 0 }
}

export async function resetSmaze() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated', balance: 0 }
  }

  // Call the reset_smaze function
  const { data, error } = await supabase.rpc('reset_smaze', {
    p_user_id: user.id
  })

  if (error) {
    return { error: error.message, balance: 0 }
  }

  revalidatePath('/games/matromat')
  revalidatePath('/profile')
  
  return { balance: data?.[0] || 2000 }
}
