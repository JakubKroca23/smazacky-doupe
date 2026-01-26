"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

interface LeaderboardTabsProps {
  games: { id: string; name: string }[]
  selectedGame: string
}

export function LeaderboardTabs({ games, selectedGame }: LeaderboardTabsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {games.map((game) => (
        <Link key={game.id} href={`/leaderboard?game=${game.id}`}>
          <Button
            variant={selectedGame === game.id ? "default" : "outline"}
            size="sm"
            className={
              selectedGame === game.id
                ? "bg-primary hover:bg-primary/90 neon-glow"
                : "border-border hover:border-primary/50 hover:bg-primary/10"
            }
          >
            {game.name}
          </Button>
        </Link>
      ))}
    </div>
  )
}
