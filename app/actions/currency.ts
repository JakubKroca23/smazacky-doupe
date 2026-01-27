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

  console.log('[v0] Updating SMAŽE for user:', user.id, 'amount:', amountChange)

  // Get current balance
  const { data: currentData } = await supabase
    .from('player_stats')
    .select('smaze')
    .eq('user_id', user.id)
    .single()

  const currentBalance = currentData?.smaze || 0
  const newBalance = currentBalance + amountChange

  console.log('[v0] Current balance:', currentBalance, 'New balance:', newBalance)

  // Update balance
  const { data, error } = await supabase
    .from('player_stats')
    .update({ smaze: newBalance })
    .eq('user_id', user.id)
    .select('smaze')
    .single()

  if (error) {
    console.error('[v0] Error updating SMAŽE:', error)
    return { error: error.message, balance: currentBalance }
  }

  console.log('[v0] Successfully updated SMAŽE to:', data?.smaze)

  revalidatePath('/games/matromat')
  revalidatePath('/profile')
  
  return { balance: data?.smaze || newBalance }
}

export async function resetSmaze() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated', balance: 0 }
  }

  console.log('[v0] Resetting SMAŽE for user:', user.id)

  // Reset to 2000
  const { data, error } = await supabase
    .from('player_stats')
    .update({ smaze: 2000 })
    .eq('user_id', user.id)
    .select('smaze')
    .single()

  if (error) {
    console.error('[v0] Error resetting SMAŽE:', error)
    return { error: error.message, balance: 0 }
  }

  console.log('[v0] Successfully reset SMAŽE to:', data?.smaze)

  revalidatePath('/games/matromat')
  revalidatePath('/profile')
  
  return { balance: data?.smaze || 2000 }
}
