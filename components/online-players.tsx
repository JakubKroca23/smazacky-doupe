"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Users, Circle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function OnlinePlayers() {
  const [onlineCount, setOnlineCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase.channel('online-users')
    
    // Track this user's presence
    const trackPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        await channel
          .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState()
            const users = Object.keys(state).length
            setOnlineCount(users)
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await channel.track({
                user_id: user.id,
                online_at: new Date().toISOString(),
              })
            }
          })
      } else {
        // For non-logged in users, just count other users
        await channel
          .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState()
            const users = Object.keys(state).length
            setOnlineCount(users)
          })
          .subscribe()
      }
    }

    trackPresence()

    // Heartbeat to keep presence alive
    const heartbeat = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await channel.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
        })
      }
    }, 30000) // Update every 30 seconds

    return () => {
      clearInterval(heartbeat)
      channel.unsubscribe()
    }
  }, [])

  return (
    <Badge
      variant="outline"
      className="bg-success/10 text-success border-success/30 gap-2 px-3 py-1.5"
    >
      <Circle className="h-2 w-2 fill-success animate-pulse" />
      <Users className="h-3.5 w-3.5" />
      <span className="font-mono">{onlineCount}</span>
      <span className="text-success/80">online</span>
    </Badge>
  )
}
