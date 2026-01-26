"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Trophy, RotateCcw, Check, X, Users } from "lucide-react"
import type { User } from "@supabase/supabase-js"

const QUESTIONS = [
  {
    question: "Co si dáš k snídani na koleji?",
    answers: [
      { text: "Rohlík", points: 35 },
      { text: "Cereálie", points: 25 },
      { text: "Nic", points: 20 },
      { text: "Vajíčka", points: 12 },
      { text: "Toast", points: 8 },
    ],
  },
  {
    question: "Co děláš když máš nudu na přednášce?",
    answers: [
      { text: "Koukám na mobil", points: 40 },
      { text: "Spím", points: 25 },
      { text: "Kreslím si", points: 15 },
      { text: "Chatuju", points: 12 },
      { text: "Jdu pryč", points: 8 },
    ],
  },
  {
    question: "Jaké jídlo si objednáš když jsi líný vařit?",
    answers: [
      { text: "Pizza", points: 38 },
      { text: "Burger", points: 22 },
      { text: "Kebab", points: 18 },
      { text: "Sushi", points: 14 },
      { text: "Čína", points: 8 },
    ],
  },
  {
    question: "Co je nejhorší na kolejích?",
    answers: [
      { text: "Spolubydlící", points: 30 },
      { text: "Hluk", points: 25 },
      { text: "Sprchy", points: 20 },
      { text: "Jídlo v menze", points: 15 },
      { text: "WiFi", points: 10 },
    ],
  },
  {
    question: "Co děláš v noci před zkouškou?",
    answers: [
      { text: "Učím se", points: 35 },
      { text: "Panikařím", points: 25 },
      { text: "Spím", points: 18 },
      { text: "Netflix", points: 14 },
      { text: "Piju kafe", points: 8 },
    ],
  },
  {
    question: "Jaký je tvůj oblíbený energeťák?",
    answers: [
      { text: "Monster", points: 32 },
      { text: "Red Bull", points: 28 },
      { text: "Kofola", points: 18 },
      { text: "Semtex", points: 14 },
      { text: "Žádný", points: 8 },
    ],
  },
]

export default function CoNaToSmazkyPage() {
  const [user, setUser] = useState<User | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [guess, setGuess] = useState("")
  const [revealedAnswers, setRevealedAnswers] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [strikes, setStrikes] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [showingResult, setShowingResult] = useState(false)
  const [lastGuessCorrect, setLastGuessCorrect] = useState<boolean | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [supabase.auth])

  const saveScore = async (finalScore: number) => {
    if (!user) return
    await supabase.from("game_scores").insert({
      user_id: user.id,
      game_id: "conatosmazky",
      score: finalScore,
    })
  }

  const question = QUESTIONS[currentQuestion]

  const handleGuess = () => {
    if (!guess.trim() || showingResult) return

    const normalizedGuess = guess.toLowerCase().trim()
    const matchIndex = question.answers.findIndex(
      (a, i) => !revealedAnswers.includes(i) && a.text.toLowerCase().includes(normalizedGuess)
    )

    setShowingResult(true)

    if (matchIndex !== -1) {
      setLastGuessCorrect(true)
      setRevealedAnswers(prev => [...prev, matchIndex])
      setScore(prev => prev + question.answers[matchIndex].points)
    } else {
      setLastGuessCorrect(false)
      setStrikes(prev => prev + 1)
    }

    setTimeout(() => {
      setShowingResult(false)
      setLastGuessCorrect(null)
      setGuess("")

      // Check if all answers revealed or 3 strikes
      if (matchIndex !== -1 && revealedAnswers.length + 1 === question.answers.length) {
        nextQuestion()
      } else if (strikes + 1 >= 3) {
        nextQuestion()
      }
    }, 1500)
  }

  const nextQuestion = () => {
    if (currentQuestion + 1 >= QUESTIONS.length) {
      setGameOver(true)
      saveScore(score)
    } else {
      setCurrentQuestion(prev => prev + 1)
      setRevealedAnswers([])
      setStrikes(0)
    }
  }

  const resetGame = () => {
    setCurrentQuestion(0)
    setRevealedAnswers([])
    setScore(0)
    setStrikes(0)
    setGameOver(false)
    setGuess("")
    setShowingResult(false)
    setLastGuessCorrect(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-to-b from-accent/5 via-background to-background -z-10" />

      <header className="p-4 border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Zpět
          </Link>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-destructive/50 text-destructive">
              {Array(3).fill(0).map((_, i) => (
                <X key={i} className={`h-4 w-4 ${i < strikes ? "text-destructive" : "text-muted-foreground/30"}`} />
              ))}
            </Badge>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-chart-4" />
              <span className="font-bold text-chart-4">{score}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {!gameOver ? (
          <>
            <div className="text-center mb-8">
              <Badge className="mb-4 bg-primary/20 text-primary border-primary/50">
                Otázka {currentQuestion + 1} / {QUESTIONS.length}
              </Badge>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground text-balance">
                {question.question}
              </h1>
              <p className="text-muted-foreground mt-2 flex items-center justify-center gap-2">
                <Users className="h-4 w-4" />
                100 spolubydlících odpovědělo
              </p>
            </div>

            {/* Answer Board */}
            <Card className="mb-6 border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="grid gap-2">
                  {question.answers.map((answer, index) => {
                    const isRevealed = revealedAnswers.includes(index)
                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                          isRevealed
                            ? "bg-success/20 border border-success/50"
                            : "bg-secondary/50 border border-border/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className={`font-medium ${isRevealed ? "text-foreground" : "text-muted-foreground"}`}>
                            {isRevealed ? answer.text : "???"}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={isRevealed ? "bg-success/20 text-success border-success/50" : ""}
                        >
                          {isRevealed ? answer.points : "??"} bodů
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Input */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                {showingResult ? (
                  <div className={`text-center py-4 rounded-lg ${
                    lastGuessCorrect ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                  }`}>
                    <div className="flex items-center justify-center gap-2 text-xl font-bold">
                      {lastGuessCorrect ? (
                        <>
                          <Check className="h-6 w-6" />
                          Správně!
                        </>
                      ) : (
                        <>
                          <X className="h-6 w-6" />
                          Špatně!
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleGuess()
                    }}
                    className="flex gap-3"
                  >
                    <Input
                      value={guess}
                      onChange={(e) => setGuess(e.target.value)}
                      placeholder="Napiš svůj tip..."
                      className="flex-1 bg-input border-border focus:border-primary"
                    />
                    <Button type="submit" className="bg-primary hover:bg-primary/90 neon-glow">
                      Hádat
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            <div className="mt-4 text-center">
              <Button
                onClick={nextQuestion}
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
              >
                Přeskočit otázku
              </Button>
            </div>
          </>
        ) : (
          <Card className="border-chart-4/50 bg-gradient-to-r from-chart-4/10 to-chart-4/5">
            <CardContent className="p-8 text-center">
              <Trophy className="h-16 w-16 text-chart-4 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-foreground mb-2">Hra Dokončena!</h2>
              <p className="text-5xl font-bold text-chart-4 neon-text mb-6">{score} bodů</p>
              {user ? (
                <p className="text-success text-sm mb-6">Skóre uloženo!</p>
              ) : (
                <p className="text-muted-foreground text-sm mb-6">Přihlaš se pro uložení skóre</p>
              )}
              <Button onClick={resetGame} className="bg-primary hover:bg-primary/90 neon-glow gap-2">
                <RotateCcw className="h-4 w-4" />
                Hrát znovu
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
