"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Coins, RotateCcw, Sparkles, Trophy, Plus, Minus } from "lucide-react"
import type { User } from "@supabase/supabase-js"

const SYMBOLS = ["🍕", "🍺", "📚", "💤", "☕", "🎮", "🍜"]
const SYMBOL_VALUES: Record<string, number> = {
  "🍕": 2,
  "🍺": 3,
  "📚": 4,
  "💤": 5,
  "☕": 3,
  "🎮": 4,
  "🍜": 2,
}

type ReelRow = string[]

const PAYOUTS = [
  { match: 3, multiplier: 3, name: "Trojice" },
  { match: 4, multiplier: 10, name: "Čtveřice" },
  { match: 5, multiplier: 50, name: "JACKPOT!" },
]

const LINE_PAYOUTS = [
  { lines: 1, multiplier: 1 },
  { lines: 2, multiplier: 3 },
  { lines: 3, multiplier: 5 },
]

export default function MatromatPage() {
  const [user, setUser] = useState<User | null>(null)
  const [coins, setCoins] = useState(1000)
  const [bet, setBet] = useState(10)
  const [reels, setReels] = useState<ReelRow[]>([
    ["🍕", "🍺", "📚", "💤", "☕"],
    ["🍕", "🍺", "📚", "💤", "☕"],
    ["🍕", "🍺", "📚", "💤", "☕"],
  ])
  const [spinning, setSpinning] = useState(false)
  const [lastWin, setLastWin] = useState(0)
  const [winningLines, setWinningLines] = useState<number[]>([])
  const [jackpot, setJackpot] = useState(false)
  const [totalWinnings, setTotalWinnings] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const supabase = createClient()

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
    setWinningLines([])
    setJackpot(false)

    // Animate reels
    let spins = 0
    const maxSpins = 20
    const interval = setInterval(() => {
      setReels([
        SYMBOLS.sort(() => Math.random() - 0.5).slice(0, 5),
        SYMBOLS.sort(() => Math.random() - 0.5).slice(0, 5),
        SYMBOLS.sort(() => Math.random() - 0.5).slice(0, 5),
      ])
      spins++

      if (spins >= maxSpins) {
        clearInterval(interval)
        // Final result
        const finalReels: ReelRow[] = [
          Array(5).fill(0).map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]),
          Array(5).fill(0).map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]),
          Array(5).fill(0).map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]),
        ]
        setReels(finalReels)
        calculateWin(finalReels)
        setSpinning(false)
      }
    }, 80)
  }

  const calculateWin = (finalReels: ReelRow[]) => {
    let totalWin = 0
    const winLines: number[] = []

    // Check each horizontal line
    finalReels.forEach((row, lineIndex) => {
      const counts: Record<string, number> = {}
      row.forEach(symbol => {
        counts[symbol] = (counts[symbol] || 0) + 1
      })

      // Find best match
      let bestMatch = 0
      let winningSymbol = ""
      Object.entries(counts).forEach(([symbol, count]) => {
        if (count >= 3 && count > bestMatch) {
          bestMatch = count
          winningSymbol = symbol
        }
      })

      // Calculate payout for this line
      const payout = PAYOUTS.find(p => p.match === bestMatch)
      if (payout) {
        const symbolValue = SYMBOL_VALUES[winningSymbol] || 1
        const lineWin = bet * payout.multiplier * symbolValue
        totalWin += lineWin
        winLines.push(lineIndex)
        
        if (bestMatch === 5) {
          setJackpot(true)
        }
      }
    })

    if (totalWin > 0) {
      setLastWin(totalWin)
      setWinningLines(winLines)
      setCoins(prev => prev + totalWin)
      setTotalWinnings(prev => prev + totalWin)
    }
  }

  const adjustBet = (amount: number) => {
    setBet(prev => Math.max(10, Math.min(100, prev + amount)))
  }

  const resetGame = () => {
    if (totalWinnings > 0) {
      saveScore()
    }
    setCoins(1000)
    setBet(10)
    setReels([
      ["🍕", "🍺", "📚", "💤", "☕"],
      ["🍕", "🍺", "📚", "💤", "☕"],
      ["🍕", "🍺", "📚", "💤", "☕"],
    ])
    setLastWin(0)
    setWinningLines([])
    setJackpot(false)
    setTotalWinnings(0)
    setHighScore(0)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-to-b from-chart-4/5 via-background to-background -z-10" />
      <div className="fixed top-40 left-1/4 w-96 h-96 bg-chart-4/10 rounded-full blur-3xl -z-10" />

      <header className="p-4 border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Zpět
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-chart-4" />
              <span className="font-bold text-chart-4">{coins.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Matromat</h1>
          <p className="text-muted-foreground">Toč válce a vyhrávej!</p>
        </div>

        {/* Slot Machine */}
        <Card className="mb-6 border-chart-4/30 bg-gradient-to-b from-card/80 to-card/50 backdrop-blur-sm overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-chart-4 via-primary to-accent" />
          
          <CardContent className="p-6">
            {/* Jackpot Display */}
            {jackpot && (
              <div className="mb-4 p-4 bg-chart-4/20 rounded-xl border border-chart-4/50 text-center animate-pulse">
                <Sparkles className="h-8 w-8 text-chart-4 mx-auto mb-2" />
                <p className="text-2xl font-bold text-chart-4 neon-text">JACKPOT!</p>
              </div>
            )}

            {/* Reels - 3 řádky x 5 válců */}
            <div className="space-y-2 mb-6 p-4 bg-background/50 rounded-xl border border-border/50">
              {reels.map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-center gap-2">
                  {row.map((symbol, colIndex) => (
                    <div
                      key={colIndex}
                      className={`w-14 h-14 md:w-16 md:h-16 flex items-center justify-center text-3xl md:text-4xl bg-secondary rounded-lg border-2 transition-all ${
                        spinning
                          ? "border-primary/50 animate-pulse"
                          : winningLines.includes(rowIndex)
                          ? "border-chart-4 bg-chart-4/20"
                          : "border-border/50"
                      }`}
                    >
                      {symbol}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Win Display */}
            {lastWin > 0 && (
              <div className="mb-4 text-center">
                <p className="text-lg text-muted-foreground">Vyhrál jsi</p>
                <p className="text-3xl font-bold text-chart-4 neon-text">+{lastWin.toLocaleString()} mincí</p>
                <p className="text-sm text-muted-foreground mt-1">{winningLines.length} vyhrávající {winningLines.length === 1 ? 'řádek' : 'řádky'}</p>
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
              className="w-full h-14 text-xl bg-gradient-to-r from-chart-4 to-primary hover:from-chart-4/90 hover:to-primary/90 neon-glow"
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

        {/* Stats & Paytable */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Celkové výhry</p>
              <p className="text-lg font-bold text-success">+{totalWinnings.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Rekord mincí</p>
              <p className="text-lg font-bold text-chart-4">{highScore.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Paytable */}
        <Card className="border-border/50 bg-card/30">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Výherní tabulka</h3>
            <div className="space-y-2 text-sm">
              {PAYOUTS.map((payout) => (
                <div key={payout.match} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{payout.name} ({payout.match} stejných v řádku)</span>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                    {payout.multiplier}x sázka
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground">* Můžeš vyhrát na více řádcích najednou!</p>
            </div>
          </CardContent>
        </Card>

        {/* Reset Button */}
        {coins === 0 && (
          <Card className="mt-6 border-destructive/30 bg-destructive/5">
            <CardContent className="p-6 text-center">
              <p className="text-lg font-semibold text-foreground mb-4">Došly ti mince!</p>
              {totalWinnings > 0 && user && (
                <p className="text-success text-sm mb-4">Celkové výhry {totalWinnings} budou uloženy</p>
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
