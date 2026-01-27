"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Coins, RotateCcw, Sparkles, Plus, Minus } from "lucide-react"
import { audioManager } from "@/lib/audio-manager"
import type { User } from "@supabase/supabase-js"

// New drug-themed symbols
const SYMBOLS = ["💊", "💉", "🧪", "⚗️", "💎", "🌿", "❄️"]
const SYMBOL_NAMES: Record<string, string> = {
  "💊": "MATRA",
  "💉": "DROG",
  "🧪": "PERVITIN",
  "⚗️": "CHEMIE",
  "💎": "KRYSTAL",
  "🌿": "TRÁVA",
  "❄️": "SNÍH",
}

const SYMBOL_VALUES: Record<string, number> = {
  "💊": 2,
  "💉": 5,
  "🧪": 10,
  "⚗️": 3,
  "💎": 15,
  "🌿": 1,
  "❄️": 8,
}

// 9x9 grid = 81 lines total
// Lines: 9 horizontal + 9 vertical + 18 diagonal (9+9) + many other patterns
type Grid = string[][]

export default function MatromatPage() {
  const [user, setUser] = useState<User | null>(null)
  const [coins, setCoins] = useState(1000)
  const [bet, setBet] = useState(10)
  const [grid, setGrid] = useState<Grid>(Array(9).fill(null).map(() => Array(9).fill("💊")))
  const [spinning, setSpinning] = useState(false)
  const [lastWin, setLastWin] = useState(0)
  const [winningCells, setWinningCells] = useState<Set<string>>(new Set())
  const [jackpot, setJackpot] = useState(false)
  const [totalWinnings, setTotalWinnings] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [animationProgress, setAnimationProgress] = useState(0)
  const supabase = createClient()
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [supabase.auth])

  useEffect(() => {
    if (coins > highScore) {
      setHighScore(coins)
    }
  }, [coins, highScore])

  const saveScore = async () => {
    if (!user || totalWinnings <= 0) return
    await supabase.from("game_scores").insert({
      user_id: user.id,
      game_id: "matromat",
      score: totalWinnings,
    })
  }

  const spin = () => {
    if (coins < bet || spinning) return

    setSpinning(true)
    setCoins(prev => prev - bet)
    setLastWin(0)
    setWinningCells(new Set())
    setJackpot(false)
    setAnimationProgress(0)
    audioManager.playSound('dice')

    // Smooth column-by-column animation from left to right
    let columnIndex = 0
    const animateColumn = () => {
      if (columnIndex < 9) {
        // Update this column with random symbols
        setGrid(prev => {
          const newGrid = prev.map(row => [...row])
          for (let row = 0; row < 9; row++) {
            newGrid[row][columnIndex] = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
          }
          return newGrid
        })
        columnIndex++
        setAnimationProgress((columnIndex / 9) * 100)
        animationRef.current = window.setTimeout(animateColumn, 100) // 100ms per column = smooth
      } else {
        // Animation complete, calculate win
        setSpinning(false)
        setAnimationProgress(100)
        calculateWin()
      }
    }

    animateColumn()
  }

  const calculateWin = () => {
    const newGrid = grid
    let totalWin = 0
    const winCells = new Set<string>()
    let hasJackpot = false

    // Check all 81 possible winning lines
    const lines: number[][][] = []

    // Horizontal lines (9)
    for (let row = 0; row < 9; row++) {
      lines.push(Array(9).fill(null).map((_, col) => [row, col]))
    }

    // Vertical lines (9)
    for (let col = 0; col < 9; col++) {
      lines.push(Array(9).fill(null).map((_, row) => [row, col]))
    }

    // Main diagonals (2)
    lines.push(Array(9).fill(null).map((_, i) => [i, i])) // Top-left to bottom-right
    lines.push(Array(9).fill(null).map((_, i) => [i, 8 - i])) // Top-right to bottom-left

    // Parallel diagonals - top-left to bottom-right direction (14)
    for (let startCol = 1; startCol < 9; startCol++) {
      const line: number[][] = []
      for (let i = 0; i < 9 - startCol; i++) {
        line.push([i, startCol + i])
      }
      if (line.length >= 3) lines.push(line)
    }
    for (let startRow = 1; startRow < 9; startRow++) {
      const line: number[][] = []
      for (let i = 0; i < 9 - startRow; i++) {
        line.push([startRow + i, i])
      }
      if (line.length >= 3) lines.push(line)
    }

    // Parallel diagonals - top-right to bottom-left direction (14)
    for (let startCol = 0; startCol < 8; startCol++) {
      const line: number[][] = []
      for (let i = 0; i <= startCol && i < 9; i++) {
        line.push([i, startCol - i])
      }
      if (line.length >= 3) lines.push(line)
    }
    for (let startRow = 1; startRow < 9; startRow++) {
      const line: number[][] = []
      for (let i = 0; startRow + i < 9 && 8 - i >= 0; i++) {
        line.push([startRow + i, 8 - i])
      }
      if (line.length >= 3) lines.push(line)
    }

    // Additional winning patterns: 3x3 blocks (9), etc.
    for (let blockRow = 0; blockRow < 3; blockRow++) {
      for (let blockCol = 0; blockCol < 3; blockCol++) {
        const block: number[][] = []
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            block.push([blockRow * 3 + r, blockCol * 3 + c])
          }
        }
        lines.push(block)
      }
    }

    // Check each line for matches
    lines.forEach(line => {
      const symbols = line.map(([r, c]) => newGrid[r][c])
      const counts: Record<string, number> = {}
      symbols.forEach(symbol => {
        counts[symbol] = (counts[symbol] || 0) + 1
      })

      // Find best match (3 or more of same symbol)
      Object.entries(counts).forEach(([symbol, count]) => {
        if (count >= 3) {
          const symbolValue = SYMBOL_VALUES[symbol] || 1
          let multiplier = 1
          if (count === 3) multiplier = 2
          if (count === 4) multiplier = 5
          if (count === 5) multiplier = 10
          if (count >= 6) multiplier = 20
          if (count >= 7) multiplier = 50
          if (count >= 8) multiplier = 100
          if (count === 9) {
            multiplier = 500
            hasJackpot = true
          }

          const lineWin = bet * multiplier * symbolValue
          totalWin += lineWin

          // Mark winning cells
          line.forEach(([r, c]) => {
            if (newGrid[r][c] === symbol) {
              winCells.add(`${r}-${c}`)
            }
          })
        }
      })
    })

    if (totalWin > 0) {
      setLastWin(totalWin)
      setWinningCells(winCells)
      setCoins(prev => prev + totalWin)
      setTotalWinnings(prev => prev + totalWin)
      setJackpot(hasJackpot)
      audioManager.playSound(hasJackpot ? 'win' : 'coin')
    } else {
      audioManager.playSound('lose')
    }
  }

  const adjustBet = (amount: number) => {
    const newBet = bet + amount
    setBet(Math.max(10, Math.min(100, newBet)))
    audioManager.playSound('click')
  }

  const resetGame = () => {
    if (totalWinnings > 0) {
      saveScore()
    }
    setCoins(1000)
    setBet(10)
    setGrid(Array(9).fill(null).map(() => Array(9).fill("💊")))
    setLastWin(0)
    setWinningCells(new Set())
    setJackpot(false)
    setTotalWinnings(0)
    setHighScore(0)
    audioManager.playSound('click')
  }

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-to-b from-[#00ff00]/5 via-background to-background -z-10" />
      <div className="fixed top-40 left-1/4 w-96 h-96 bg-[#00ff00]/10 rounded-full blur-3xl -z-10" />

      <header className="p-4 border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Zpět
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-[#00ff00]" style={{ filter: 'drop-shadow(0 0 5px #00ff00)' }} />
              <span className="font-bold text-[#00ff00]" style={{ textShadow: '0 0 5px #00ff00' }}>{coins.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Matromat 9x9</h1>
          <p className="text-muted-foreground">81 linií - Toč a vyhrávej!</p>
        </div>

        {/* Slot Machine */}
        <Card className="mb-6 border-[#00ff00]/30 bg-gradient-to-b from-card/80 to-card/50 backdrop-blur-sm overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-[#00ff00] via-[#ff00ff] to-[#0088ff]" />
          
          <CardContent className="p-6">
            {/* Jackpot Display */}
            {jackpot && (
              <div className="mb-4 p-4 bg-[#00ff00]/20 rounded-xl border border-[#00ff00]/50 text-center animate-pulse">
                <Sparkles className="h-8 w-8 text-[#00ff00] mx-auto mb-2" style={{ filter: 'drop-shadow(0 0 10px #00ff00)' }} />
                <p className="text-2xl font-bold text-[#00ff00]" style={{ textShadow: '0 0 10px #00ff00, 0 0 20px #00ff00' }}>JACKPOT! CELÁ MŘÍŽKA!</p>
              </div>
            )}

            {/* Progress Bar */}
            {spinning && (
              <div className="mb-4">
                <div className="w-full bg-secondary/30 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#00ff00] to-[#ff00ff] transition-all duration-100"
                    style={{ width: `${animationProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* 9x9 Grid */}
            <div className="mb-6 p-4 bg-background/50 rounded-xl border border-border/50 overflow-x-auto">
              <div className="inline-block min-w-max">
                {grid.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-1 mb-1 last:mb-0">
                    {row.map((symbol, colIndex) => {
                      const cellKey = `${rowIndex}-${colIndex}`
                      const isWinning = winningCells.has(cellKey)
                      return (
                        <div
                          key={colIndex}
                          className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-lg sm:text-xl bg-secondary rounded border transition-all ${
                            spinning
                              ? "border-primary/50 animate-pulse"
                              : isWinning
                              ? "border-[#00ff00] bg-[#00ff00]/20 scale-110"
                              : "border-border/50"
                          }`}
                          style={isWinning ? { boxShadow: '0 0 10px #00ff00' } : {}}
                        >
                          {symbol}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Win Display */}
            {lastWin > 0 && !spinning && (
              <div className="mb-4 text-center">
                <p className="text-lg text-muted-foreground">Výhra!</p>
                <p className="text-3xl font-bold text-[#00ff00]" style={{ textShadow: '0 0 10px #00ff00, 0 0 20px #00ff00' }}>+{lastWin.toLocaleString()} mincí</p>
                <p className="text-sm text-muted-foreground mt-1">{winningCells.size} vyhrávajících buněk</p>
              </div>
            )}

            {/* Bet Controls */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustBet(-10)}
                disabled={bet <= 10 || spinning}
                className="border-border bg-transparent"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Sázka</p>
                <p className="text-xl font-bold text-foreground">{bet}</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustBet(10)}
                disabled={bet >= 100 || spinning}
                className="border-border bg-transparent"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Spin Button */}
            <Button
              onClick={spin}
              disabled={coins < bet || spinning}
              className="w-full h-14 text-xl bg-gradient-to-r from-[#00ff00] to-[#ff00ff] hover:from-[#00ff00]/90 hover:to-[#ff00ff]/90 text-black font-bold"
              style={{ boxShadow: '0 0 20px #00ff00, 0 0 40px #ff00ff' }}
            >
              {spinning ? "Točí se..." : coins < bet ? "Nedostatek mincí" : "ZATOČIT!"}
            </Button>

            {coins < bet && coins > 0 && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                Sniž sázku nebo začni novou hru
              </p>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Celkové výhry</p>
              <p className="text-lg font-bold text-[#00ff00]" style={{ textShadow: '0 0 5px #00ff00' }}>+{totalWinnings.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Rekord mincí</p>
              <p className="text-lg font-bold text-[#ff00ff]" style={{ textShadow: '0 0 5px #ff00ff' }}>{highScore.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Symbol Values */}
        <Card className="border-border/50 bg-card/30 mb-6">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Hodnoty symbolů</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              {Object.entries(SYMBOL_NAMES).map(([symbol, name]) => (
                <div key={symbol} className="flex items-center justify-between p-2 bg-secondary/30 rounded">
                  <span className="text-xl">{symbol}</span>
                  <span className="text-xs text-muted-foreground">{name}</span>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                    {SYMBOL_VALUES[symbol]}x
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground">* 3+ stejné symboly = výhra • 9 stejných = JACKPOT!</p>
              <p className="text-xs text-muted-foreground">* 81 způsobů jak vyhrát: řádky, sloupce, diagonály, bloky 3x3 atd.</p>
            </div>
          </CardContent>
        </Card>

        {/* Reset Button */}
        {coins === 0 && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-6 text-center">
              <p className="text-lg font-semibold text-foreground mb-4">Došly ti mince!</p>
              {totalWinnings > 0 && user && (
                <p className="text-[#00ff00] text-sm mb-4">Celkové výhry {totalWinnings} budou uloženy</p>
              )}
              <Button onClick={resetGame} className="bg-primary hover:bg-primary/90 gap-2">
                <RotateCcw className="h-4 w-4" />
                Nová hra (1000 mincí)
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
