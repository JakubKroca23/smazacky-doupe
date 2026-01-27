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
    question: "Co si dá smažka na snídani?",
    answers: [
      { text: "Rohlík s fetou", points: 40 },
      { text: "Cereálie s pivem", points: 25 },
      { text: "Perník", points: 18 },
      { text: "Zbytky z včera", points: 12 },
      { text: "Nic, spí", points: 5 },
    ],
  },
  {
    question: "Kde se smažky nejčastěji schází?",
    answers: [
      { text: "Kolej", points: 38 },
      { text: "Pivnice", points: 28 },
      { text: "U vařiče pika", points: 18 },
      { text: "Pernikárna", points: 10 },
      { text: "Knihovna (fakt?)", points: 6 },
    ],
  },
  {
    question: "Co dělá feťák v Ostravě?",
    answers: [
      { text: "Vaří piko", points: 35 },
      { text: "Prodává perník", points: 25 },
      { text: "Krade kola", points: 22 },
      { text: "Běhá po Stodolní", points: 12 },
      { text: "Studuje", points: 6 },
    ],
  },
  {
    question: "Jakou příchuť má nejlepší perník?",
    answers: [
      { text: "Medový", points: 32 },
      { text: "Skořicový", points: 26 },
      { text: "Čokoládový", points: 20 },
      { text: "Piko s medem", points: 14 },
      { text: "Pivní", points: 8 },
    ],
  },
  {
    question: "Co si smažka dá k večeři?",
    answers: [
      { text: "Pizza", points: 36 },
      { text: "Smažák", points: 28 },
      { text: "Perník", points: 18 },
      { text: "Piko", points: 12 },
      { text: "Instantní nudle", points: 6 },
    ],
  },
  {
    question: "Kde vařič pika ukrývá svou várku?",
    answers: [
      { text: "Pod postelí", points: 34 },
      { text: "V lednici", points: 26 },
      { text: "Na balkoně", points: 20 },
      { text: "V perníkárně", points: 12 },
      { text: "U souseda", points: 8 },
    ],
  },
  {
    question: "Co je nejhorší na ostravských kolejích?",
    answers: [
      { text: "Feťáci", points: 36 },
      { text: "Hluk z pika", points: 28 },
      { text: "Zápach perníku", points: 18 },
      { text: "Smažky co křičí", points: 12 },
      { text: "Ceny v menze", points: 6 },
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
      <div className="fixed inset-0 bg-gradient-to-b from-[#ff00ff]/5 via-background to-background -z-10" />

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
              <Trophy className="h-5 w-5 text-[#00ff00]" style={{ filter: 'drop-shadow(0 0 5px #00ff00)' }} />
              <span className="font-bold text-[#00ff00]" style={{ textShadow: '0 0 5px #00ff00' }}>{score}</span>
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
                100 ostravských smažek odpovědělo
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
          <Card className="border-[#00ff00]/50 bg-gradient-to-r from-[#00ff00]/10 to-[#00ff00]/5">
            <CardContent className="p-8 text-center">
              <Trophy className="h-16 w-16 text-[#00ff00] mx-auto mb-4" style={{ filter: 'drop-shadow(0 0 10px #00ff00)' }} />
              <h2 className="text-3xl font-bold text-foreground mb-2">Hra Dokončena!</h2>
              <p className="text-5xl font-bold text-[#00ff00] mb-6" style={{ textShadow: '0 0 10px #00ff00, 0 0 20px #00ff00' }}>{score} bodů</p>
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
