"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, RotateCcw, Trophy, Zap, Target } from "lucide-react"

type GameState = "waiting" | "ready" | "go" | "clicked" | "too-early" | "finished"

export default function ReactionGame() {
  const [gameState, setGameState] = useState<GameState>("waiting")
  const [reactionTime, setReactionTime] = useState<number | null>(null)
  const [times, setTimes] = useState<number[]>([])
  const [round, setRound] = useState(0)
  const [highScore, setHighScore] = useState<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  const TOTAL_ROUNDS = 5

  useEffect(() => {
    loadHighScore()
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const loadHighScore = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("game_scores")
      .select("score")
      .eq("user_id", user.id)
      .eq("game_id", "reaction")
      .order("score", { ascending: false })
      .limit(1)
      .single()

    if (data) setHighScore(data.score)
  }

  const saveScore = useCallback(async (avgTime: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const score = Math.max(0, Math.round(10000 - avgTime * 10))
    
    await supabase.from("game_scores").insert({
      user_id: user.id,
      game_id: "reaction",
      score,
      metadata: { averageTime: avgTime, rounds: TOTAL_ROUNDS },
    })

    if (!highScore || score > highScore) {
      setHighScore(score)
    }
  }, [supabase, highScore])

  const startRound = () => {
    setGameState("ready")
    setReactionTime(null)

    const delay = Math.random() * 3000 + 2000 // 2-5 seconds
    timeoutRef.current = setTimeout(() => {
      setGameState("go")
      startTimeRef.current = performance.now()
    }, delay)
  }

  const handleClick = () => {
    if (gameState === "waiting") {
      startRound()
    } else if (gameState === "ready") {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setGameState("too-early")
    } else if (gameState === "go") {
      const endTime = performance.now()
      const time = Math.round(endTime - startTimeRef.current)
      setReactionTime(time)
      setTimes((prev) => [...prev, time])
      setGameState("clicked")
      setRound((r) => r + 1)
    } else if (gameState === "clicked") {
      if (round >= TOTAL_ROUNDS) {
        const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length)
        saveScore(avgTime)
        setGameState("finished")
      } else {
        startRound()
      }
    } else if (gameState === "too-early") {
      startRound()
    }
  }

  const resetGame = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setGameState("waiting")
    setReactionTime(null)
    setTimes([])
    setRound(0)
  }

  const averageTime = times.length > 0
    ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    : null

  const getBackgroundColor = () => {
    switch (gameState) {
      case "ready":
        return "bg-destructive"
      case "go":
        return "bg-success"
      case "too-early":
        return "bg-[#ff00ff]"
      case "clicked":
        return "bg-primary"
      default:
        return "bg-secondary"
    }
  }

  const getMessage = () => {
    switch (gameState) {
      case "waiting":
        return { title: "Click to Start", subtitle: "Test your reflexes!" }
      case "ready":
        return { title: "Wait...", subtitle: "Wait for green" }
      case "go":
        return { title: "CLICK NOW!", subtitle: "" }
      case "too-early":
        return { title: "Too Early!", subtitle: "Click to try again" }
      case "clicked":
        return {
          title: `${reactionTime}ms`,
          subtitle: round >= TOTAL_ROUNDS ? "Click to see results" : "Click to continue",
        }
      case "finished":
        return {
          title: `Average: ${averageTime}ms`,
          subtitle: "Game complete!",
        }
      default:
        return { title: "", subtitle: "" }
    }
  }

  const { title, subtitle } = getMessage()
  const currentScore = averageTime ? Math.max(0, Math.round(10000 - averageTime * 10)) : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#00ff00]/5 via-background to-background -z-10" />
      <div className="fixed top-20 right-1/4 w-96 h-96 bg-[#ff00ff]/10 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Games</span>
          </Link>

          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#00ff00]" style={{ filter: 'drop-shadow(0 0 5px #00ff00)' }} />
            <span className="font-bold text-lg text-[#00ff00]" style={{ textShadow: '0 0 5px #00ff00' }}>Lightning Reflex</span>
          </div>

          <Button variant="ghost" size="sm" onClick={resetGame} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Restart</span>
          </Button>
        </div>
      </header>

      {/* Stats */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Badge variant="outline" className="bg-secondary/50 gap-2 px-3 py-1.5">
            <Target className="h-3.5 w-3.5 text-[#00ff00]" style={{ filter: 'drop-shadow(0 0 5px #00ff00)' }} />
            <span className="text-[#00ff00]">Round {Math.min(round + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</span>
          </Badge>
          {averageTime && (
            <Badge variant="outline" className="bg-secondary/50 gap-2 px-3 py-1.5">
              <Zap className="h-3.5 w-3.5 text-[#ff00ff]" style={{ filter: 'drop-shadow(0 0 5px #ff00ff)' }} />
              <span className="text-[#ff00ff]">Avg: {averageTime}ms</span>
            </Badge>
          )}
          {highScore && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 gap-2 px-3 py-1.5">
              <Trophy className="h-3.5 w-3.5" />
              Best: {highScore.toLocaleString()}
            </Badge>
          )}
        </div>
      </div>

      {/* Game Area */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleClick}
            disabled={gameState === "finished"}
            className={`w-full aspect-[4/3] rounded-2xl transition-all duration-200 ${getBackgroundColor()} ${
              gameState === "go" ? "cursor-pointer animate-pulse" : "cursor-pointer"
            } flex flex-col items-center justify-center p-8`}
          >
            <span className={`text-4xl sm:text-5xl font-bold mb-2 ${
              gameState === "go" ? "text-success-foreground" : "text-foreground"
            }`}>
              {title}
            </span>
            {subtitle && (
              <span className={`text-lg ${
                gameState === "go" ? "text-success-foreground/80" : "text-muted-foreground"
              }`}>
                {subtitle}
              </span>
            )}
          </button>

          {/* Times History */}
          {times.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Your Times</h3>
              <div className="flex flex-wrap gap-2">
                {times.map((time, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className={`${
                      time < 250
                        ? "bg-[#00ff00]/20 text-[#00ff00] border-[#00ff00]/50"
                        : time < 350
                        ? "bg-[#ff00ff]/20 text-[#ff00ff] border-[#ff00ff]/50"
                        : "bg-[#ff0055]/20 text-[#ff0055] border-[#ff0055]/50"
                    }`}
                  >
                    {time}ms
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Game Over Modal */}
        {gameState === "finished" && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-sm border-primary/50 bg-card">
              <CardContent className="p-6 text-center space-y-4">
                <div className="relative inline-block">
                  <Zap className="h-16 w-16 text-[#00ff00] mx-auto" style={{ filter: 'drop-shadow(0 0 10px #00ff00)' }} />
                  <div className="absolute inset-0 blur-lg bg-[#00ff00]/30 -z-10" />
                </div>
                <h2 className="text-2xl font-bold">Game Complete!</h2>
                <p className="text-muted-foreground">
                  Average reaction time: {averageTime}ms
                </p>
                <div className="text-3xl font-bold text-[#00ff00]" style={{ textShadow: '0 0 10px #00ff00, 0 0 20px #00ff00' }}>
                  Score: {currentScore.toLocaleString()}
                </div>
                <div className="flex gap-3 pt-4">
                  <Button onClick={resetGame} className="flex-1 bg-primary hover:bg-primary/90 neon-glow">
                    Play Again
                  </Button>
                  <Link href="/" className="flex-1">
                    <Button variant="outline" className="w-full border-border bg-transparent">
                      Home
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
