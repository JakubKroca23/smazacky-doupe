"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Gamepad2, Trophy, Target, TrendingUp } from "lucide-react"

interface ProfileStatsProps {
  totalGames: number
  totalScore: number
  bestScore: number
  averageScore: number
}

export function ProfileStats({
  totalGames,
  totalScore,
  bestScore,
  averageScore,
}: ProfileStatsProps) {
  const stats = [
    {
      label: "Odehráno Her",
      value: totalGames,
      icon: Gamepad2,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/30",
    },
    {
      label: "Celkové Skóre",
      value: totalScore.toLocaleString("cs-CZ"),
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
      borderColor: "border-success/30",
    },
    {
      label: "Nejlepší Skóre",
      value: bestScore.toLocaleString("cs-CZ"),
      icon: Trophy,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
      borderColor: "border-chart-4/30",
    },
    {
      label: "Průměrné Skóre",
      value: averageScore.toLocaleString("cs-CZ"),
      icon: Target,
      color: "text-accent",
      bgColor: "bg-accent/10",
      borderColor: "border-accent/30",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card
            key={stat.label}
            className={`border-border/50 bg-card/50 backdrop-blur-sm ${stat.borderColor}`}
          >
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
