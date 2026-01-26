"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, RotateCcw, Trophy, Target, Play, ArrowUp, ArrowDown, ArrowLeftIcon, ArrowRight } from "lucide-react"

const GRID_SIZE = 15
const CELL_SIZE = 20
const INITIAL_SPEED = 150

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT"
type Position = { x: number; y: number }

export default function SnakeGame() {
  const [snake, setSnake] = useState<Position[]>([{ x: 7, y: 7 }])
  const [food, setFood] = useState<Position>({ x: 10, y: 10 })
  const [direction, setDirection] = useState<Direction>("RIGHT")
  const [gameOver, setGameOver] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState<number | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const directionRef = useRef(direction)
  const supabase = createClient()

  useEffect(() => {
    loadHighScore()
  }, [])

  useEffect(() => {
    directionRef.current = direction
  }, [direction])

  const loadHighScore = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("game_scores")
      .select("score")
      .eq("user_id", user.id)
      .eq("game_id", "snake")
      .order("score", { ascending: false })
      .limit(1)
      .single()

    if (data) setHighScore(data.score)
  }

  const saveScore = useCallback(async (finalScore: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from("game_scores").insert({
      user_id: user.id,
      game_id: "snake",
      score: finalScore,
      metadata: { length: snake.length },
    })

    if (!highScore || finalScore > highScore) {
      setHighScore(finalScore)
    }
  }, [supabase, highScore, snake.length])

  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      }
    } while (currentSnake.some((seg) => seg.x === newFood.x && seg.y === newFood.y))
    return newFood
  }, [])

  const moveSnake = useCallback(() => {
    if (gameOver || !gameStarted || isPaused) return

    setSnake((prevSnake) => {
      const head = prevSnake[0]
      const dir = directionRef.current
      let newHead: Position

      switch (dir) {
        case "UP":
          newHead = { x: head.x, y: head.y - 1 }
          break
        case "DOWN":
          newHead = { x: head.x, y: head.y + 1 }
          break
        case "LEFT":
          newHead = { x: head.x - 1, y: head.y }
          break
        case "RIGHT":
          newHead = { x: head.x + 1, y: head.y }
          break
      }

      // Check wall collision
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        setGameOver(true)
        saveScore(score)
        return prevSnake
      }

      // Check self collision
      if (prevSnake.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
        setGameOver(true)
        saveScore(score)
        return prevSnake
      }

      const newSnake = [newHead, ...prevSnake]

      // Check food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((s) => s + 100)
        setFood(generateFood(newSnake))
        return newSnake
      }

      newSnake.pop()
      return newSnake
    })
  }, [gameOver, gameStarted, isPaused, food, generateFood, score, saveScore])

  useEffect(() => {
    const speed = Math.max(50, INITIAL_SPEED - Math.floor(score / 500) * 10)
    const interval = setInterval(moveSnake, speed)
    return () => clearInterval(interval)
  }, [moveSnake, score])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted && e.key === " ") {
        startGame()
        return
      }

      if (e.key === " ") {
        setIsPaused((p) => !p)
        return
      }

      const currentDir = directionRef.current
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          if (currentDir !== "DOWN") setDirection("UP")
          break
        case "ArrowDown":
        case "s":
        case "S":
          if (currentDir !== "UP") setDirection("DOWN")
          break
        case "ArrowLeft":
        case "a":
        case "A":
          if (currentDir !== "RIGHT") setDirection("LEFT")
          break
        case "ArrowRight":
        case "d":
        case "D":
          if (currentDir !== "LEFT") setDirection("RIGHT")
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameStarted])

  const startGame = () => {
    setSnake([{ x: 7, y: 7 }])
    setFood(generateFood([{ x: 7, y: 7 }]))
    setDirection("RIGHT")
    setScore(0)
    setGameOver(false)
    setGameStarted(true)
    setIsPaused(false)
  }

  const handleDirectionButton = (dir: Direction) => {
    const currentDir = directionRef.current
    if (
      (dir === "UP" && currentDir !== "DOWN") ||
      (dir === "DOWN" && currentDir !== "UP") ||
      (dir === "LEFT" && currentDir !== "RIGHT") ||
      (dir === "RIGHT" && currentDir !== "LEFT")
    ) {
      setDirection(dir)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-primary/5 via-background to-background -z-10" />
      <div className="fixed top-20 left-1/3 w-96 h-96 bg-success/10 rounded-full blur-3xl -z-10" />

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
            <Target className="h-5 w-5 text-success" />
            <span className="font-bold text-lg">Cyber Snake</span>
          </div>

          <Button variant="ghost" size="sm" onClick={startGame} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Restart</span>
          </Button>
        </div>
      </header>

      {/* Stats */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Badge variant="outline" className="bg-secondary/50 gap-2 px-3 py-1.5">
            <Target className="h-3.5 w-3.5 text-success" />
            Score: {score}
          </Badge>
          <Badge variant="outline" className="bg-secondary/50 gap-2 px-3 py-1.5">
            Length: {snake.length}
          </Badge>
          {highScore && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 gap-2 px-3 py-1.5">
              <Trophy className="h-3.5 w-3.5" />
              Best: {highScore.toLocaleString()}
            </Badge>
          )}
        </div>
      </div>

      {/* Game Area */}
      <main className="container mx-auto px-4 py-4">
        <div className="flex flex-col items-center gap-6">
          {/* Game Board */}
          <div
            className="relative border-2 border-border rounded-lg overflow-hidden bg-card/50"
            style={{
              width: GRID_SIZE * CELL_SIZE + 4,
              height: GRID_SIZE * CELL_SIZE + 4,
            }}
          >
            {/* Grid lines */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `
                  linear-gradient(to right, var(--border) 1px, transparent 1px),
                  linear-gradient(to bottom, var(--border) 1px, transparent 1px)
                `,
                backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
              }}
            />

            {/* Snake */}
            {snake.map((segment, index) => (
              <div
                key={index}
                className={`absolute rounded-sm transition-all duration-75 ${
                  index === 0
                    ? "bg-primary neon-glow z-10"
                    : "bg-primary/70"
                }`}
                style={{
                  left: segment.x * CELL_SIZE + 2,
                  top: segment.y * CELL_SIZE + 2,
                  width: CELL_SIZE - 2,
                  height: CELL_SIZE - 2,
                }}
              />
            ))}

            {/* Food */}
            <div
              className="absolute rounded-full bg-accent animate-pulse neon-pink-glow"
              style={{
                left: food.x * CELL_SIZE + 2,
                top: food.y * CELL_SIZE + 2,
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
              }}
            />

            {/* Start Overlay */}
            {!gameStarted && !gameOver && (
              <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
                <Button onClick={startGame} className="bg-primary hover:bg-primary/90 neon-glow gap-2">
                  <Play className="h-4 w-4" />
                  Start Game
                </Button>
                <p className="text-xs text-muted-foreground mt-2">or press Space</p>
              </div>
            )}

            {/* Pause Overlay */}
            {isPaused && gameStarted && !gameOver && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xl font-bold text-foreground">PAUSED</p>
                  <p className="text-xs text-muted-foreground mt-1">Press Space to continue</p>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Controls */}
          <div className="grid grid-cols-3 gap-2 md:hidden">
            <div />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleDirectionButton("UP")}
              className="border-border"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <div />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleDirectionButton("LEFT")}
              className="border-border"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleDirectionButton("DOWN")}
              className="border-border"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleDirectionButton("RIGHT")}
              className="border-border"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Use arrow keys or WASD to move. Space to pause.
          </p>
        </div>

        {/* Game Over Modal */}
        {gameOver && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-sm border-destructive/50 bg-card">
              <CardContent className="p-6 text-center space-y-4">
                <div className="relative inline-block">
                  <Target className="h-16 w-16 text-destructive mx-auto" />
                </div>
                <h2 className="text-2xl font-bold">Game Over</h2>
                <p className="text-muted-foreground">
                  You reached a length of {snake.length}
                </p>
                <div className="text-3xl font-bold text-primary neon-text">
                  Score: {score.toLocaleString()}
                </div>
                <div className="flex gap-3 pt-4">
                  <Button onClick={startGame} className="flex-1 bg-primary hover:bg-primary/90 neon-glow">
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
