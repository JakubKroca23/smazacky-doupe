'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveRaidCompletion({
  raidType,
  success,
  timeSeconds,
  xpEarned,
  currencyEarned,
  itemsEarned = []
}: {
  raidType: string
  success: boolean
  timeSeconds: number
  xpEarned: number
  currencyEarned: number
  itemsEarned?: Array<{ name: string; icon?: string; quantity?: number }>
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  console.log('[v0] Saving raid completion:', { raidType, success, timeSeconds, xpEarned, currencyEarned })

  // Insert new raid completion record
  const { error: raidError } = await supabase
    .from('raid_stats')
    .insert({
      user_id: user.id,
      raid_id: raidType.toLowerCase().replace(/\s+/g, '_'),
      raid_name: raidType,
      success,
      completion_time: timeSeconds,
      xp_earned: xpEarned,
      currency_earned: currencyEarned,
      items_earned: itemsEarned,
    })

  if (raidError) {
    console.error('[v0] Error saving raid completion:', raidError)
    return { error: raidError.message }
  }

  // Update player stats with XP and currency
  const { data: playerStats } = await supabase
    .from('player_stats')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (playerStats) {
    const { error: updateError } = await supabase
      .from('player_stats')
      .update({
        xp: (playerStats.xp || 0) + xpEarned,
        currency: (playerStats.currency || 0) + currencyEarned,
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('[v0] Error updating player stats:', updateError)
    }
  } else {
    // Create player_stats if it doesn't exist
    const { error: createError } = await supabase
      .from('player_stats')
      .insert({
        user_id: user.id,
        level: 1,
        xp: xpEarned,
        currency: currencyEarned,
        health: 100,
        stamina: 100,
        luck: 10,
        smaze: 2000,
      })

    if (createError) {
      console.error('[v0] Error creating player stats:', createError)
    }
  }

  revalidatePath('/profile')
  revalidatePath('/raids')
  
  console.log('[v0] Raid completion saved successfully')
  return { success: true }
}
