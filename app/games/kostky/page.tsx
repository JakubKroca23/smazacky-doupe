"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Dices, Trophy, RotateCcw, Lock, Unlock } from "lucide-react"
import type { User } from "@supabase/supabase-js"

const SCORING = {
  ones: { name: "Jedničky", desc: "Součet jedniček" },
  twos: { name: "Dvojky", desc: "Součet dvojek" },
  threes: { name: "Trojky", desc: "Součet trojek" },
  fours: { name: "Čtyřky", desc: "Součet čtyřek" },
  fives: { name: "Pětky", desc: "Součet pětek" },
  sixes: { name: "Šestky", desc: "Součet šestek" },
  threeOfKind: { name: "Trojice", desc: "3 stejné - součet všech" },
  fourOfKind: { name: "Čtveřice", desc: "4 stejné - součet všech" },
  fullHouse: { name: "Full House", desc: "3+2 stejné = 25 bodů" },
  smallStraight: { name: "Malá postupka", desc: "4 po sobě = 30 bodů" },
  largeStraight: { name: "Velká postupka", desc: "5 po sobě = 40 bodů" },
  yahtzee: { name: "SMAŽKA!", desc: "5 stejných = 50 bodů" },
  chance: { name: "Šance", desc: "Součet všech" },
}

type ScoreKey = keyof typeof SCORING

export default function KostkyPage() {
  const [user, setUser] = useState<User | null>(null)
  const [dice, setDice] = useState<number[]>([1, 1, 1, 1, 1])
  const [held, setHeld] = useState<boolean[]>([false, false, false, false, false])
  const [rollsLeft, setRollsLeft] = useState(3)
  const [scores, setScores] = useState<Partial<Record<ScoreKey, number>>>({})
  const [gameOver, setGameOver] = useState(false)
  const [rolling, setRolling] = useState(false)
  const [totalScore, setTotalScore] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [supabase.auth])

  useEffect(() => {
    const total = Object.values(scores).reduce((sum, val) => sum + (val || 0), 0)
    setTotalScore(total)
    if (Object.keys(scores).length === 13) {
      setGameOver(true)
      if (user) saveScore(total)
    }
  }, [scores, user])

  const saveScore = async (score: number) => {
    await supabase.from("game_scores").insert({
      user_id: user!.id,
      game_id: "kostky",
      score,
    })
  }

  const rollDice = () => {
    if (rollsLeft === 0) return
    setRolling(true)
    
    setTimeout(() => {
      setDice(prev => prev.map((d, i) => held[i] ? d : Math.floor(Math.random() * 6) + 1))
      setRollsLeft(prev => prev - 1)
      setRolling(false)
    }, 500)
  }

  const toggleHold = (index: number) => {
    if (rollsLeft === 3) return
    setHeld(prev => prev.map((h, i) => i === index ? !h : h))
  }

  const calculateScore = (key: ScoreKey): number => {
    const counts = [0, 0, 0, 0, 0, 0]
    dice.forEach(d => counts[d - 1]++)
    const sum = dice.reduce((a, b) => a + b, 0)

    switch (key) {
      case "ones": return counts[0] * 1
      case "twos": return counts[1] * 2
      case "threes": return counts[2] * 3
      case "fours": return counts[3] * 4
      case "fives": return counts[4] * 5
      case "sixes": return counts[5] * 6
      case "threeOfKind": return counts.some(c => c >= 3) ? sum : 0
      case "fourOfKind": return counts.some(c => c >= 4) ? sum : 0
      case "fullHouse": return counts.includes(3) && counts.includes(2) ? 25 : 0
      case "smallStraight": {
        const sorted = [...new Set(dice)].sort()
        const str = sorted.join("")
        return str.includes("1234") || str.includes("2345") || str.includes("3456") ? 30 : 0
      }
      case "largeStraight": {
        const sorted = [...new Set(dice)].sort().join("")
        return sorted === "12345" || sorted === "23456" ? 40 : 0
      }
      case "yahtzee": return counts.includes(5) ? 50 : 0
      case "chance": return sum
      default: return 0
    }
  }

  const selectScore = (key: ScoreKey) => {
    if (scores[key] !== undefined || rollsLeft === 3) return
    setScores(prev => ({ ...prev, [key]: calculateScore(key) }))
    setRollsLeft(3)
    setHeld([false, false, false, false, false])
  }

  const resetGame = () => {
    setDice([1, 1, 1, 1, 1])
    setHeld([false, false, false, false, false])
    setRollsLeft(3)
    setScores({})
    setGameOver(false)
    setTotalScore(0)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-to-b from-primary/5 via-background to-background -z-10" />
      
      <header className="p-4 border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Zpět
          </Link>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-chart-4" />
            <span className="font-bold text-chart-4">{totalScore}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Smažácký Kostky</h1>
          <p className="text-muted-foreground">Hoď kostkami a vyber kategorii pro body</p>
        </div>

        {/* Dice Area */}
        <Card className="mb-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex justify-center gap-3 mb-6 flex-wrap">
              {dice.map((value, index) => (
                <button
                  key={index}
                  onClick={() => toggleHold(index)}
                  disabled={rollsLeft === 3}
                  className={`relative w-16 h-16 md:w-20 md:h-20 rounded-xl text-3xl md:text-4xl font-bold transition-all ${
                    rolling && !held[index]
                      ? "animate-bounce bg-primary/20 text-primary"
                      : held[index]
                      ? "bg-chart-4/20 text-chart-4 border-2 border-chart-4"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  } ${rollsLeft === 3 ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {value}
                  {held[index] && (
                    <Lock className="absolute -top-2 -right-2 h-5 w-5 text-chart-4" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex justify-center gap-4">
              <Button
                onClick={rollDice}
                disabled={rollsLeft === 0 || rolling || gameOver}
                className="bg-primary hover:bg-primary/90 neon-glow gap-2"
              >
                <Dices className="h-5 w-5" />
                Hodit ({rollsLeft})
              </Button>
              <Button
                onClick={resetGame}
                variant="outline"
                className="border-border hover:bg-secondary gap-2 bg-transparent"
              >
                <RotateCcw className="h-4 w-4" />
                Nová hra
              </Button>
            </div>

            {rollsLeft < 3 && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Klikni na kostku pro její zamčení
              </p>
            )}
          </CardContent>
        </Card>

        {/* Score Sheet */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(Object.keys(SCORING) as ScoreKey[]).map((key) => {
            const isSelected = scores[key] !== undefined
            const potentialScore = calculateScore(key)
            const canSelect = !isSelected && rollsLeft < 3

            return (
              <button
                key={key}
                onClick={() => selectScore(key)}
                disabled={!canSelect || gameOver}
                className={`flex items-center justify-between p-4 rounded-xl transition-all text-left ${
                  isSelected
                    ? "bg-primary/10 border border-primary/30"
                    : canSelect
                    ? "bg-card/50 border border-border/50 hover:border-primary/50 cursor-pointer"
                    : "bg-card/30 border border-border/30 cursor-not-allowed opacity-50"
                }`}
              >
                <div>
                  <p className="font-semibold text-foreground">{SCORING[key].name}</p>
                  <p className="text-xs text-muted-foreground">{SCORING[key].desc}</p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    isSelected
                      ? "bg-primary/20 text-primary border-primary/50"
                      : canSelect && potentialScore > 0
                      ? "bg-success/20 text-success border-success/50"
                      : "bg-secondary text-muted-foreground"
                  }
                >
                  {isSelected ? scores[key] : canSelect ? potentialScore : "-"}
                </Badge>
              </button>
            )
          })}
        </div>

        {/* Game Over */}
        {gameOver && (
          <Card className="mt-6 border-chart-4/50 bg-gradient-to-r from-chart-4/10 to-chart-4/5">
            <CardContent className="p-6 text-center">
              <Trophy className="h-12 w-12 text-chart-4 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Hra Dokončena!</h2>
              <p className="text-4xl font-bold text-chart-4 neon-text mb-4">{totalScore} bodů</p>
              {user ? (
                <p className="text-success text-sm">Skóre uloženo!</p>
              ) : (
                <p className="text-muted-foreground text-sm">Přihlaš se pro uložení skóre</p>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
