"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Users, Circle } from "lucide-react"

export function OnlinePlayers() {
  const [onlineCount, setOnlineCount] = useState(0)

  useEffect(() => {
    // Simulate online players with random fluctuation
    const baseCount = 127
    const updateCount = () => {
      const fluctuation = Math.floor(Math.random() * 20) - 10
      setOnlineCount(Math.max(50, baseCount + fluctuation))
    }
    
    updateCount()
    const interval = setInterval(updateCount, 5000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <Badge
      variant="outline"
      className="bg-success/10 text-success border-success/30 gap-2 px-3 py-1.5"
    >
      <Circle className="h-2 w-2 fill-success animate-pulse" />
      <Users className="h-3.5 w-3.5" />
      <span className="font-mono">{onlineCount}</span>
      <span className="text-success/80">online</span>
    </Badge>
  )
}
