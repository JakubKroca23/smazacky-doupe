"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Dices, UsersRound, Trophy, Split as Slot } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface GameCardProps {
  id: string
  title: string
  description: string
  icon: "dice" | "users" | "slot" | "trophy"
  difficulty: "Lehká" | "Střední" | "Těžká"
  highScore?: number
}

const iconMap = {
  dice: Dices,
  users: UsersRound,
  slot: Slot,
  trophy: Trophy,
}

const difficultyColors = {
  "Lehká": "bg-success/20 text-success border-success/50",
  "Střední": "bg-chart-4/20 text-chart-4 border-chart-4/50",
  "Těžká": "bg-destructive/20 text-destructive border-destructive/50",
}

export function GameCard({
  id,
  title,
  description,
  icon,
  difficulty,
  highScore,
}: GameCardProps) {
  const Icon = iconMap[icon]
  const [playersOnline, setPlayersOnline] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    // Subscribe to game-specific presence channel
    const channel = supabase.channel(`game-${id}`)
    
    // Track presence for this game
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const count = Object.keys(state).length
        setPlayersOnline(count)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user viewing this game card
          await channel.track({
            viewing: true,
            user_id: Math.random().toString(36).substring(7),
            timestamp: new Date().toISOString(),
          })
        }
      })

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, supabase])

  return (
    <Link href={`/games/${id}`}>
      <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 cursor-pointer h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 group-hover:neon-border transition-all">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <Badge variant="outline" className={difficultyColors[difficulty]}>
              {difficulty}
            </Badge>
          </div>

          <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {description}
          </p>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="relative flex items-center">
                <Users className="h-3.5 w-3.5 text-success" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-success rounded-full animate-pulse" />
              </div>
              <span>{playersOnline} online</span>
            </div>
            {highScore !== undefined && (
              <div className="flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-chart-4" />
                <span>Rekord: {highScore.toLocaleString()}</span>
              </div>
            )}
          </div>
        </CardContent>

        {/* Hover glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity -z-10" />
      </Card>
    </Link>
  )
}
