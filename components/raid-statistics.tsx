'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Trophy, Target, Timer, Star } from 'lucide-react'

interface RaidStatisticsProps {
  stats: {
    total_completed: number
    total_success: number
    total_failed: number
    best_time_seconds: number | null
    total_xp_earned: number
    total_currency_earned: number
    items_earned: any[]
  }
}

export function RaidStatistics({ stats }: RaidStatisticsProps) {
  const successRate = stats.total_completed > 0 
    ? Math.round((stats.total_success / stats.total_completed) * 100)
    : 0

  const formatTime = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celkem Raidů</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_completed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total_success} úspěšných / {stats.total_failed} neúspěšných
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Úspěšnost</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <Progress value={successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nejlepší Čas</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(stats.best_time_seconds)}</div>
            <p className="text-xs text-muted-foreground">Minuty:Sekundy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celkem XP</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_xp_earned.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total_currency_earned.toLocaleString()} měna
            </p>
          </CardContent>
        </Card>
      </div>

      {stats.items_earned && stats.items_earned.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Získané Předměty z Raidů</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {stats.items_earned.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-3 rounded-lg border bg-card"
                >
                  <div className="text-2xl">{item.icon || '📦'}</div>
                  <div>
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      x{item.quantity || 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
