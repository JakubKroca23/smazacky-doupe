"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface GameCardProps {
  id: string
  title: string
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
        className={`glass-effect border-2 border-[#222] rounded-[20px] p-10 text-center text-white transition-all duration-300 cursor-pointer relative flex flex-col items-center justify-center h-96 group hover:translate-y-[-15px] ${hoverColorMap[hoverColor]}`}
      >
        {/* Animated background glow */}
        <div className="absolute inset-0 rounded-[20px] bg-gradient-to-br from-[#ff00ff]/5 via-transparent to-[#0088ff]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Badge - NASYPÁNA NOVINKA */}
        {badge === "NASYPÁNA NOVINKA" && (
          <div className="absolute top-[-12px] right-[-20px] bg-gradient-to-r from-[#00ff00] to-[#00dd00] text-black px-6 py-2 text-xs font-black rotate-[12deg] shadow-[0_0_30px_rgba(0,255,0,0.8)] z-[100] animate-pulse rounded-full uppercase tracking-wider">
            {badge}
          </div>
        )}

        {/* Main Icon - Large and Glowing */}
        <div className="text-8xl mb-6 animate-bounce group-hover:scale-110 transition-transform duration-300" style={{ textShadow: '0 0 30px rgba(255, 0, 255, 0.6)' }}>
          {emoji}
        </div>

        {/* Title - Premium styling */}
        <div className="text-3xl font-black uppercase mb-8 tracking-widest group-hover:text-[#00ff00] transition-colors duration-300" style={{ textShadow: '0 0 20px rgba(0, 255, 0, 0.3)' }}>
          {title}
        </div>

        {/* Difficulty badge - Subtle */}
        <div className="inline-block px-4 py-2 bg-[#222]/80 text-xs font-bold uppercase tracking-[2px] rounded-full mb-6 text-[#00ff00]">
          ▶ {difficulty} ◀
        </div>

        {/* Players online indicator */}
        <div className="mt-auto flex items-center gap-2 text-sm text-[#0088ff] font-bold">
          <div className="w-2 h-2 bg-[#00ff00] rounded-full animate-pulse" />
          <span>{playersOnline} HRÁČŮ ONLINE</span>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-[#00ff00] to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  )
}
