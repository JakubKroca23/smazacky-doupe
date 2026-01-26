"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, RotateCcw, Trophy, Clock, Puzzle, Check } from "lucide-react"

const GRID_SIZE = 4
const WINNING_ORDER = Array.from({ length: GRID_SIZE * GRID_SIZE - 1 }, (_, i) => i + 1)

function generatePuzzle(): (number | null)[] {
  const tiles = [...WINNING_ORDER, null]
  
  // Fisher-Yates shuffle
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[tiles[i], tiles[j]] = [tiles[j], tiles[i]]
  }
  
  // Check if solvable (for 4x4, inversions + row of blank from bottom must be odd)
  let inversions = 0
  const flatTiles = tiles.filter((t) => t !== null) as number[]
  for (let i = 0; i < flatTiles.length; i++) {
    for (let j = i + 1; j < flatTiles.length; j++) {
      if (flatTiles[i] > flatTiles[j]) inversions++
    }
  }
  
  const blankRow = Math.floor(tiles.indexOf(null) / GRID_SIZE)
  const blankFromBottom = GRID_SIZE - blankRow
  
  if ((inversions + blankFromBottom) % 2 === 0) {
    // Not solvable, swap first two non-null tiles
    const idx1 = tiles.findIndex((t) => t !== null)
    let idx2 = tiles.findIndex((t, i) => t !== null && i > idx1)
    ;[tiles[idx1], tiles[idx2]] = [tiles[idx2], tiles[idx1]]
  }
  
  return tiles
}

export default function PuzzleGame() {
  const [tiles, setTiles] = useState<(number | null)[]>([])
  const [moves, setMoves] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameWon, setGameWon] = useState(false)
  const [time, setTime] = useState(0)
  const [highScore, setHighScore] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    setTiles(generatePuzzle())
    loadHighScore()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (gameStarted && !gameWon) {
      interval = setInterval(() => {
        setTime((t) => t + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [gameStarted, gameWon])

  const loadHighScore = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("game_scores")
      .select("score")
      .eq("user_id", user.id)
      .eq("game_id", "puzzle")
      .order("score", { ascending: false })
      .limit(1)
      .single()

    if (data) setHighScore(data.score)
  }

  const saveScore = useCallback(async (finalTime: number, finalMoves: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const score = Math.max(0, 10000 - (finalTime * 5) - (finalMoves * 20))
    
    await supabase.from("game_scores").insert({
      user_id: user.id,
      game_id: "puzzle",
      score,
      metadata: { time: finalTime, moves: finalMoves },
    })

    if (!highScore || score > highScore) {
      setHighScore(score)
    }
  }, [supabase, highScore])

  const checkWin = (newTiles: (number | null)[]) => {
    for (let i = 0; i < WINNING_ORDER.length; i++) {
      if (newTiles[i] !== WINNING_ORDER[i]) return false
    }
    return newTiles[WINNING_ORDER.length] === null
  }

  const handleTileClick = (index: number) => {
    if (tiles[index] === null || gameWon) return

    if (!gameStarted) setGameStarted(true)

    const blankIndex = tiles.indexOf(null)
    const row = Math.floor(index / GRID_SIZE)
    const col = index % GRID_SIZE
    const blankRow = Math.floor(blankIndex / GRID_SIZE)
    const blankCol = blankIndex % GRID_SIZE

    // Check if adjacent to blank
    const isAdjacent =
      (row === blankRow && Math.abs(col - blankCol) === 1) ||
      (col === blankCol && Math.abs(row - blankRow) === 1)

    if (!isAdjacent) return

    const newTiles = [...tiles]
    ;[newTiles[index], newTiles[blankIndex]] = [newTiles[blankIndex], newTiles[index]]
    setTiles(newTiles)
    setMoves((m) => m + 1)

    if (checkWin(newTiles)) {
      setGameWon(true)
      saveScore(time, moves + 1)
    }
  }

  const resetGame = () => {
    setTiles(generatePuzzle())
    setMoves(0)
    setTime(0)
    setGameStarted(false)
    setGameWon(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const currentScore = Math.max(0, 10000 - (time * 5) - (moves * 20))

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-primary/5 via-background to-background -z-10" />
      <div className="fixed top-20 right-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl -z-10" />

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
            <Puzzle className="h-5 w-5 text-neon-cyan" />
            <span className="font-bold text-lg">Grid Logic</span>
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
            <Puzzle className="h-3.5 w-3.5 text-neon-cyan" />
            {moves} moves
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
        <div className="max-w-sm mx-auto">
          <div className="grid grid-cols-4 gap-2">
            {tiles.map((tile, index) => (
              <button
                key={index}
                onClick={() => handleTileClick(index)}
                disabled={tile === null || gameWon}
                className={`aspect-square rounded-lg transition-all duration-150 ${
                  tile === null
                    ? "bg-transparent"
                    : "bg-card border-2 border-border hover:border-primary/50 hover:bg-card/80 cursor-pointer active:scale-95"
                } ${tile === index + 1 ? "border-success/50" : ""}`}
              >
                {tile !== null && (
                  <span className={`text-xl sm:text-2xl font-bold ${
                    tile === index + 1 ? "text-success" : "text-foreground"
                  }`}>
                    {tile}
                  </span>
                )}
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Click tiles adjacent to the empty space to move them
          </p>
        </div>

        {/* Game Won Modal */}
        {gameWon && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-sm border-success/50 bg-card">
              <CardContent className="p-6 text-center space-y-4">
                <div className="relative inline-block">
                  <Check className="h-16 w-16 text-success mx-auto" />
                  <div className="absolute inset-0 blur-lg bg-success/30 -z-10" />
                </div>
                <h2 className="text-2xl font-bold">Puzzle Solved!</h2>
                <p className="text-muted-foreground">
                  Completed in {formatTime(time)} with {moves} moves
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
