"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, RotateCcw, Trophy, Clock, Zap, Brain } from "lucide-react"

const SYMBOLS = ["A", "B", "C", "D", "E", "F", "G", "H"]
const COLORS = [
  "from-primary to-accent",
  "from-accent to-neon-cyan",
  "from-neon-cyan to-primary",
  "from-chart-4 to-accent",
  "from-success to-neon-cyan",
  "from-primary to-chart-4",
  "from-accent to-success",
  "from-neon-cyan to-chart-4",
]

interface CardType {
  id: number
  symbol: string
  color: string
  isFlipped: boolean
  isMatched: boolean
}

function createCards(): CardType[] {
  const cards: CardType[] = []
  for (let i = 0; i < 8; i++) {
    const card = { symbol: SYMBOLS[i], color: COLORS[i] }
    cards.push({ ...card, id: i * 2, isFlipped: false, isMatched: false })
    cards.push({ ...card, id: i * 2 + 1, isFlipped: false, isMatched: false })
  }
  return cards.sort(() => Math.random() - 0.5)
}

export default function MemoryGame() {
  const [cards, setCards] = useState<CardType[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [matches, setMatches] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [time, setTime] = useState(0)
  const [highScore, setHighScore] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    setCards(createCards())
    loadHighScore()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (gameStarted && !gameOver) {
      interval = setInterval(() => {
        setTime((t) => t + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [gameStarted, gameOver])

  const loadHighScore = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("game_scores")
      .select("score")
      .eq("user_id", user.id)
      .eq("game_id", "memory")
      .order("score", { ascending: false })
      .limit(1)
      .single()

    if (data) setHighScore(data.score)
  }

  const saveScore = useCallback(async (finalTime: number, finalMoves: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const score = Math.max(0, 10000 - (finalTime * 10) - (finalMoves * 50))
    
    await supabase.from("game_scores").insert({
      user_id: user.id,
      game_id: "memory",
      score,
      metadata: { time: finalTime, moves: finalMoves },
    })

    if (!highScore || score > highScore) {
      setHighScore(score)
    }
  }, [supabase, highScore])

  const handleCardClick = (id: number) => {
    if (flippedCards.length === 2) return
    if (cards.find((c) => c.id === id)?.isMatched) return
    if (flippedCards.includes(id)) return

    if (!gameStarted) setGameStarted(true)

    const newFlipped = [...flippedCards, id]
    setFlippedCards(newFlipped)
    setCards((prev) =>
      prev.map((card) =>
        card.id === id ? { ...card, isFlipped: true } : card
      )
    )

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1)
      const [first, second] = newFlipped
      const firstCard = cards.find((c) => c.id === first)
      const secondCard = cards.find((c) => c.id === second)

      if (firstCard?.symbol === secondCard?.symbol) {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card) =>
              card.id === first || card.id === second
                ? { ...card, isMatched: true }
                : card
            )
          )
          const newMatches = matches + 1
          setMatches(newMatches)
          setFlippedCards([])

          if (newMatches === 8) {
            setGameOver(true)
            saveScore(time, moves + 1)
          }
        }, 300)
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card) =>
              card.id === first || card.id === second
                ? { ...card, isFlipped: false }
                : card
            )
          )
          setFlippedCards([])
        }, 800)
      }
    }
  }

  const resetGame = () => {
    setCards(createCards())
    setFlippedCards([])
    setMoves(0)
    setMatches(0)
    setTime(0)
    setGameStarted(false)
    setGameOver(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const currentScore = Math.max(0, 10000 - (time * 10) - (moves * 50))

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-primary/5 via-background to-background -z-10" />
      <div className="fixed top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />

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
            <Brain className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg">Neon Memory</span>
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
            <Clock className="h-3.5 w-3.5 text-primary" />
            {formatTime(time)}
          </Badge>
          <Badge variant="outline" className="bg-secondary/50 gap-2 px-3 py-1.5">
            <Zap className="h-3.5 w-3.5 text-chart-4" />
            {moves} moves
          </Badge>
          <Badge variant="outline" className="bg-secondary/50 gap-2 px-3 py-1.5">
            <Trophy className="h-3.5 w-3.5 text-accent" />
            {matches}/8 matched
          </Badge>
          {highScore && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 gap-2 px-3 py-1.5">
              <Trophy className="h-3.5 w-3.5" />
              Best: {highScore.toLocaleString()}
            </Badge>
          )}
        </div>
      </div>

      {/* Game Board */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto">
          <div className="grid grid-cols-4 gap-3">
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                disabled={card.isMatched || flippedCards.length === 2}
                className={`aspect-square rounded-xl transition-all duration-300 transform ${
                  card.isFlipped || card.isMatched
                    ? "rotate-0"
                    : "hover:scale-105"
                } ${card.isMatched ? "opacity-50" : ""}`}
              >
                <Card
                  className={`h-full w-full overflow-hidden border-2 transition-all ${
                    card.isFlipped || card.isMatched
                      ? `border-transparent bg-gradient-to-br ${card.color}`
                      : "border-border/50 bg-card hover:border-primary/50"
                  }`}
                >
                  <CardContent className="h-full flex items-center justify-center p-0">
                    {card.isFlipped || card.isMatched ? (
                      <span className="text-2xl sm:text-3xl font-bold text-primary-foreground drop-shadow-lg">
                        {card.symbol}
                      </span>
                    ) : (
                      <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                    )}
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </div>

        {/* Game Over Modal */}
        {gameOver && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-sm border-primary/50 bg-card">
              <CardContent className="p-6 text-center space-y-4">
                <div className="relative inline-block">
                  <Trophy className="h-16 w-16 text-chart-4 mx-auto" />
                  <div className="absolute inset-0 blur-lg bg-chart-4/30 -z-10" />
                </div>
                <h2 className="text-2xl font-bold">Congratulations!</h2>
                <p className="text-muted-foreground">
                  You completed the game in {formatTime(time)} with {moves} moves
                </p>
                <div className="text-3xl font-bold text-primary neon-text">
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
