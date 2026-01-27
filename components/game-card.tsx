"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface GameCardProps {
  id: string
  title: string
  description: string
  icon: "dice" | "users" | "slot" | "trophy"
  difficulty: "Lehká" | "Střední" | "Těžká"
  badge?: string
  badgeColor?: "blue" | "green" | "pink" | "badtrip"
  emoji?: string
  hoverColor?: "blue" | "green" | "pink" | "badtrip"
}

const badgeColorMap = {
  blue: "bg-[#0088ff] text-black",
  green: "bg-[#00ff00] text-black",
  pink: "bg-[#ff00ff] text-black",
  badtrip: "bg-[#ff0055] text-white",
}

const hoverColorMap = {
  blue: "hover:border-[#0088ff] hover:neon-glow-blue",
  green: "hover:border-[#00ff00] hover:neon-glow-green",
  pink: "hover:border-[#ff00ff] hover:neon-glow-pink",
  badtrip: "hover:border-[#ff0055] hover:neon-glow-badtrip",
}

export function GameCard({
  id,
  title,
  description,
  difficulty,
  badge,
  badgeColor = "blue",
  emoji = "🎮",
  hoverColor = "blue",
}: GameCardProps) {
  const [playersOnline, setPlayersOnline] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase.channel(`game-${id}`)
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const count = Object.keys(state).length
        setPlayersOnline(count)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            viewing: true,
            user_id: Math.random().toString(36).substring(7),
            timestamp: new Date().toISOString(),
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, supabase])

  return (
    <Link href={`/games/${id}`}>
      <div
        className={`glass-effect border-2 border-[#222] rounded-[15px] p-8 text-center text-white transition-all duration-300 cursor-pointer relative flex flex-col hover:translate-y-[-10px] ${hoverColorMap[hoverColor]}`}
      >
        {/* Badge like "NASYPANÁ NOVINKA" */}
        {badge && badge === "NASYPANÁ NOVINKA" && (
          <div className="absolute top-[-15px] right-[-25px] bg-[#00ff00] text-black px-8 py-2 text-lg font-black rotate-[15deg] shadow-[0_0_20px_#00ff00] z-[100] animate-flash-green">
            {badge}
          </div>
        )}
        
        {/* Regular badge (top left) */}
        {badge && badge !== "NASYPANÁ NOVINKA" && (
          <div className={`absolute top-[15px] left-[15px] ${badgeColorMap[badgeColor]} px-2 py-0.5 text-[0.6em] font-bold rounded-[10px]`}>
            {badge}
          </div>
        )}

        {/* Emoji Icon */}
        <div className="text-6xl mb-2">{emoji}</div>

        {/* Title */}
        <div className="text-xl font-bold uppercase mb-2">{title}</div>

        {/* Description */}
        <div className="text-sm text-muted-foreground mb-4 flex-grow">
          {description}
        </div>

        {/* Players online */}
        <div className="text-xs text-muted-foreground">
          👥 {playersOnline} hráčů online
        </div>
      </div>
    </Link>
  )
}
