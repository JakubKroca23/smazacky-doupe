"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Trophy, ArrowRight, Sparkles } from "lucide-react"

interface Event {
  id: string
  title: string
  description: string
  start_time: string
  end_time: string
  reward_description: string | null
  is_active: boolean
}

export function EventsBanner() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchEvents = async () => {
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .lte("start_time", now)
        .gte("end_time", now)
        .order("end_time", { ascending: true })
        .limit(2)

      if (!error && data) {
        setEvents(data)
      }
      setLoading(false)
    }

    fetchEvents()
  }, [supabase])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <Card key={i} className="bg-card/30 border-border/50 animate-pulse">
            <CardContent className="p-6 h-40" />
          </Card>
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <Card className="bg-card/30 border-border/50">
        <CardContent className="p-6 text-center text-muted-foreground">
          Momentálně nejsou žádné aktivní akce. Vrať se později!
        </CardContent>
      </Card>
    )
  }

  const getTimeRemaining = (endTime: string) => {
    const end = new Date(endTime).getTime()
    const now = Date.now()
    const diff = end - now

    if (diff <= 0) return "Skončilo"

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h zbývá`
    }
    return `${hours}h ${minutes}m zbývá`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {events.map((event, index) => (
        <Card
          key={event.id}
          className={`relative overflow-hidden border-border/50 ${
            index === 0
              ? "bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30"
              : "bg-gradient-to-br from-accent/10 to-neon-cyan/10 border-accent/30"
          }`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-2xl" />
          
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between mb-3">
              <Badge
                variant="outline"
                className={`${
                  index === 0
                    ? "bg-primary/20 text-primary border-primary/50"
                    : "bg-accent/20 text-accent border-accent/50"
                }`}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Živá Akce
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {getTimeRemaining(event.end_time)}
              </div>
            </div>

            <h3 className="text-lg font-bold text-foreground mb-2">{event.title}</h3>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {event.description}
            </p>

            <div className="flex items-center justify-between">
              {event.reward_description && (
                <div className="flex items-center gap-1.5 text-xs text-chart-4">
                  <Trophy className="h-3.5 w-3.5" />
                  <span>{event.reward_description}</span>
                </div>
              )}
              <Link href="/events">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary hover:bg-primary/10 gap-1"
                >
                  Zobrazit
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
