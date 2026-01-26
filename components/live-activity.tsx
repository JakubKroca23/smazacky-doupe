"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Zap, Trophy, Gamepad2, Circle } from "lucide-react"

interface Activity {
  id: number
  type: "score" | "achievement" | "join"
  player: string
  game?: string
  score?: number
  message: string
}

const SAMPLE_PLAYERS = [
  "SmažkaKing", "HranolPro", "KečupMistr", "NuggetBoss", 
  "ŘízekNinja", "SmazenyLord", "ChipsHero", "PomFritAce",
  "GoldenCrispy", "HotDogHrdina", "BurgerKral", "PizzaMaster"
]

const GAMES = ["Smažácký Kostky", "Co na to Smažky?", "Matromat", "Chceš být Perníkářem?"]

function generateActivity(): Activity {
  const player = SAMPLE_PLAYERS[Math.floor(Math.random() * SAMPLE_PLAYERS.length)]
  const type = ["score", "achievement", "join"][Math.floor(Math.random() * 3)] as Activity["type"]
  const game = GAMES[Math.floor(Math.random() * GAMES.length)]
  
  switch (type) {
    case "score":
      const score = Math.floor(Math.random() * 5000) + 3000
      return {
        id: Date.now(),
        type,
        player,
        game,
        score,
        message: `získal ${score.toLocaleString("cs-CZ")} bodů v ${game}`,
      }
    case "achievement":
      const achievements = ["Nový Rekord!", "První Výhra!", "Rychlík", "Perfektní Hra"]
      return {
        id: Date.now(),
        type,
        player,
        message: `získal ocenění "${achievements[Math.floor(Math.random() * achievements.length)]}"`,
      }
    case "join":
      return {
        id: Date.now(),
        type,
        player,
        message: "se připojil do doupěte",
      }
  }
}

export function LiveActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Initial activities
    setActivities([generateActivity(), generateActivity(), generateActivity()])

    // Add new activity every few seconds
    const interval = setInterval(() => {
      setActivities((prev) => {
        const newActivities = [generateActivity(), ...prev.slice(0, 4)]
        return newActivities
      })
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  if (!isVisible || activities.length === 0) return null

  return (
    <Card className="border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Circle className="h-2 w-2 fill-success text-success animate-pulse" />
            <span className="text-sm font-medium text-foreground">Živá Aktivita</span>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Skrýt
          </button>
        </div>
        
        <div className="space-y-2 max-h-40 overflow-hidden">
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              className={`flex items-center gap-2 text-sm transition-all duration-500 ${
                index === 0 ? "animate-in slide-in-from-top" : ""
              } ${index > 2 ? "opacity-50" : ""}`}
            >
              {activity.type === "score" && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 shrink-0">
                  <Zap className="h-3 w-3 mr-1" />
                  Skóre
                </Badge>
              )}
              {activity.type === "achievement" && (
                <Badge variant="outline" className="bg-chart-4/10 text-chart-4 border-chart-4/30 shrink-0">
                  <Trophy className="h-3 w-3 mr-1" />
                  Ocenění
                </Badge>
              )}
              {activity.type === "join" && (
                <Badge variant="outline" className="bg-success/10 text-success border-success/30 shrink-0">
                  <Gamepad2 className="h-3 w-3 mr-1" />
                  Připojil se
                </Badge>
              )}
              <span className="text-muted-foreground truncate">
                <span className="font-medium text-foreground">{activity.player}</span>{" "}
                {activity.message}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
