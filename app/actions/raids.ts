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

  // Get current raid stats
  const { data: currentStats } = await supabase
    .from('raid_stats')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const newStats = {
    user_id: user.id,
    total_completed: (currentStats?.total_completed || 0) + 1,
    total_success: (currentStats?.total_success || 0) + (success ? 1 : 0),
    total_failed: (currentStats?.total_failed || 0) + (success ? 0 : 1),
    best_time_seconds: 
      !currentStats?.best_time_seconds || timeSeconds < currentStats.best_time_seconds
        ? timeSeconds
        : currentStats.best_time_seconds,
    total_xp_earned: (currentStats?.total_xp_earned || 0) + xpEarned,
    total_currency_earned: (currentStats?.total_currency_earned || 0) + currencyEarned,
    items_earned: [...(currentStats?.items_earned || []), ...itemsEarned],
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('raid_stats')
    .upsert(newStats, { onConflict: 'user_id' })

  if (error) {
    console.error('[v0] Error saving raid stats:', error)
    return { error: error.message }
  }

  // Also update player stats with XP and currency
  const { data: playerStats } = await supabase
    .from('player_stats')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (playerStats) {
    await supabase
      .from('player_stats')
      .update({
        xp: (playerStats.xp || 0) + xpEarned,
        currency: (playerStats.currency || 0) + currencyEarned,
      })
      .eq('user_id', user.id)
  }

  revalidatePath('/profile')
  revalidatePath('/raids')
  
  return { success: true }
}
