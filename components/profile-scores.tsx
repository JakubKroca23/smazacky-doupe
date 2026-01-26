"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Zap } from "lucide-react"

interface Score {
  id: string
  game_id: string
  score: number
  created_at: string
}

interface ProfileScoresProps {
  scores: Score[]
}

const gameNames: Record<string, string> = {
  kostky: "Smažácký Kostky",
  conatosmazky: "Co na to Smažky?",
  matromat: "Matromat",
  pernikar: "Chceš být Perníkářem?",
  memory: "Paměť",
  reaction: "Reakce",
  snake: "Had",
  puzzle: "Puzzle",
}

export function ProfileScores({ scores }: ProfileScoresProps) {
  if (scores.length === 0) {
    return null
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          Nedávná Aktivita
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {scores.map((score) => (
            <div
              key={score.id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/30"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {gameNames[score.game_id] || score.game_id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(score.created_at).toLocaleDateString("cs-CZ", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <p className="text-lg font-bold text-primary">
                {score.score.toLocaleString("cs-CZ")}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
