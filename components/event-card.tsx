"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Trophy, Sparkles } from "lucide-react"

interface Event {
  id: string
  title: string
  description: string
  start_time: string
  end_time: string
  reward_description: string | null
}

interface EventCardProps {
  event: Event
  status: "active" | "upcoming" | "past"
}

export function EventCard({ event, status }: EventCardProps) {
  const [timeLeft, setTimeLeft] = useState("")

  useEffect(() => {
    const updateTime = () => {
      const now = Date.now()
      const targetTime = status === "active"
        ? new Date(event.end_time).getTime()
        : new Date(event.start_time).getTime()
      const diff = targetTime - now

      if (diff <= 0) {
        setTimeLeft(status === "active" ? "Skončilo" : "Začalo")
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`)
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`)
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [event.end_time, event.start_time, status])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("cs-CZ", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const statusConfig = {
    active: {
      badge: "Živě",
      badgeClass: "bg-success/20 text-success border-success/50 animate-pulse",
      cardClass: "border-success/30 bg-gradient-to-br from-success/10 to-success/5",
      icon: Sparkles,
      iconColor: "text-success",
    },
    upcoming: {
      badge: "Připravujeme",
      badgeClass: "bg-primary/20 text-primary border-primary/50",
      cardClass: "border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5",
      icon: Clock,
      iconColor: "text-primary",
    },
    past: {
      badge: "Skončilo",
      badgeClass: "bg-muted text-muted-foreground border-muted",
      cardClass: "border-border/30 bg-card/30 opacity-70",
      icon: Calendar,
      iconColor: "text-muted-foreground",
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Card className={`relative overflow-hidden ${config.cardClass} transition-all hover:scale-[1.02]`}>
      {status === "active" && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-success/20 to-transparent rounded-full blur-2xl" />
      )}
      
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between mb-3">
          <Badge variant="outline" className={config.badgeClass}>
            <Icon className="h-3 w-3 mr-1" />
            {config.badge}
          </Badge>
          {status !== "past" && (
            <div className="flex items-center gap-1.5 text-sm font-mono">
              <Clock className={`h-3.5 w-3.5 ${config.iconColor}`} />
              <span className={config.iconColor}>{timeLeft}</span>
            </div>
          )}
        </div>

        <h3 className="text-lg font-bold text-foreground mb-2">{event.title}</h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {event.description}
        </p>

        <div className="flex flex-col gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(event.start_time)} - {formatDate(event.end_time)}</span>
          </div>
          
          {event.reward_description && (
            <div className="flex items-center gap-1.5 text-chart-4">
              <Trophy className="h-3.5 w-3.5" />
              <span>{event.reward_description}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
