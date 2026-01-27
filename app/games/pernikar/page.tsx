"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Trophy, RotateCcw, HelpCircle, PhoneCall, Users, Sparkles } from "lucide-react"
import type { User } from "@supabase/supabase-js"

const PRIZE_LEVELS = [
  100, 200, 300, 500, 1000,
  2000, 4000, 8000, 16000, 32000,
  64000, 125000, 250000, 500000, 1000000,
]

const QUESTIONS = [
  {
    question: "Co je typické pro ostravskou smažku?",
    options: ["Hluk v noci", "Čistota", "Ticho", "Ranní vstávání"],
    correct: 0,
  },
  {
    question: "Kolik piv vydrží průměrná smažka za večer?",
    options: ["1-2", "3-5", "6-10", "Nepočítá je"],
    correct: 3,
  },
  {
    question: "Kde se vyrábí nejlepší perník v Ostravě?",
    options: ["V pekárně", "Na kolejích", "U feťáka", "V pernikárně"],
    correct: 3,
  },
  {
    question: "Co dělá vařič pika?",
    options: ["Kávu", "Čaj", "Pervitin", "Polévku"],
    correct: 2,
  },
  {
    question: "Jaká je nejoblíbenější ulice v Ostravě?",
    options: ["Hlavní", "Stodolní", "Nádražní", "Školní"],
    correct: 1,
  },
  {
    question: "Co si smažka nejčastěji objedná?",
    options: ["Salát", "Smažák", "Sushi", "Ovesnou kaši"],
    correct: 1,
  },
  {
    question: "Kdy smažka chodí spát?",
    options: ["21:00", "23:00", "01:00", "Až ráno"],
    correct: 3,
  },
  {
    question: "Co je v Ostravě všude?",
    options: ["Stromy", "Uhlí", "Kavárny", "Kola"],
    correct: 1,
  },
  {
    question: "Jaký je ostravský pozdrav?",
    options: ["Ahoj", "Čau", "Nazdar", "Hej ty"],
    correct: 3,
  },
  {
    question: "Co smažka studuje nejméně?",
    options: ["Ráno", "Odpoledne", "Večer", "Vůbec"],
    correct: 3,
  },
  {
    question: "Kde feťák skrývá svou várku?",
    options: ["V bance", "Pod postelí", "V lednici", "U babičky"],
    correct: 1,
  },
  {
    question: "Kolik perníků snědí smažka denně?",
    options: ["0", "1-2", "3-5", "Kilo"],
    correct: 0,
  },
  {
    question: "Co je nejdůležitější na kolejích?",
    options: ["Studium", "Parta", "Klid", "Čistota"],
    correct: 1,
  },
  {
    question: "Jaký je nejlepší čas na piko?",
    options: ["Ráno", "Odpoledne", "Večer", "Vždy"],
    correct: 3,
  },
  {
    question: "Co znamená 'jít na jedno'?",
    options: ["Jedno pivo", "Celou noc", "Domů brzo", "Na kafe"],
    correct: 1,
  },
]

const LIFELINES = {
  fifty: { name: "50:50", icon: HelpCircle, description: "Odstraní 2 špatné odpovědi" },
  phone: { name: "Feťák volá", icon: PhoneCall, description: "Zavolej feťákovi" },
  audience: { name: "Smažky", icon: Users, description: "Zeptej se smažek" },
}

export default function PernikarPage() {
  const [user, setUser] = useState<User | null>(null)
  const [currentLevel, setCurrentLevel] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isAnswerLocked, setIsAnswerLocked] = useState(false)
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [lifelines, setLifelines] = useState({ fifty: true, phone: true, audience: true })
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([])
  const [phoneHint, setPhoneHint] = useState<string | null>(null)
  const [audienceVotes, setAudienceVotes] = useState<number[] | null>(null)
  const supabase = createClient()

  // Ensure all hooks are called at the top level
  const [isFiftyFiftyUsed, setIsFiftyFiftyUsed] = useState(false)
  const [isPhoneUsed, setIsPhoneUsed] = useState(false)
  const [isAudienceUsed, setIsAudienceUsed] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [supabase.auth])

  useEffect(() => {
    useFiftyFifty()
  }, [isFiftyFiftyUsed])

  useEffect(() => {
    usePhone()
  }, [isPhoneUsed])

  useEffect(() => {
    useAudience()
  }, [isAudienceUsed])

  const saveScore = async (score: number) => {
    if (!user) return
    await supabase.from("game_scores").insert({
      user_id: user.id,
      game_id: "pernikar",
      score,
    })
  }

  const question = QUESTIONS[currentLevel]
  const currentPrize = PRIZE_LEVELS[currentLevel]
  const safeHaven = currentLevel >= 5 ? PRIZE_LEVELS[4] : currentLevel >= 10 ? PRIZE_LEVELS[9] : 0

  const selectAnswer = (index: number) => {
    if (isAnswerLocked || hiddenOptions.includes(index)) return
    setSelectedAnswer(index)
  }

  const lockAnswer = () => {
    if (selectedAnswer === null) return
    setIsAnswerLocked(true)
    
    setTimeout(() => {
      setIsAnswerRevealed(true)
      
      setTimeout(() => {
        if (selectedAnswer === question.correct) {
          if (currentLevel === QUESTIONS.length - 1) {
            setWon(true)
            setGameOver(true)
            saveScore(currentPrize)
          } else {
            setCurrentLevel(prev => prev + 1)
            setSelectedAnswer(null)
            setIsAnswerLocked(false)
            setIsAnswerRevealed(false)
            setHiddenOptions([])
            setPhoneHint(null)
            setAudienceVotes(null)
          }
        } else {
          setGameOver(true)
          saveScore(safeHaven)
        }
      }, 2000)
    }, 1500)
  }

  const useFiftyFifty = () => {
    if (!lifelines.fifty || !isFiftyFiftyUsed) return
    setLifelines(prev => ({ ...prev, fifty: false }))
    
    const wrongOptions = question.options
      .map((_, i) => i)
      .filter(i => i !== question.correct)
    
    const toHide = wrongOptions.sort(() => Math.random() - 0.5).slice(0, 2)
    setHiddenOptions(toHide)
    setIsFiftyFiftyUsed(false)
  }

  const usePhone = () => {
    if (!lifelines.phone || !isPhoneUsed) return
    setLifelines(prev => ({ ...prev, phone: false }))
    
    const hints = [
      `Brácho, to je ${question.options[question.correct]}! Věř mi!`,
      `Tak tohle je jasný, že ${question.options[question.correct]}, ne?`,
      `Hmm, myslím že ${question.options[question.correct]}... nebo ne? Nevím, jsem zfetovanej.`,
    ]
    setPhoneHint(hints[Math.floor(Math.random() * hints.length)])
    setIsPhoneUsed(false)
  }

  const useAudience = () => {
    if (!lifelines.audience || !isAudienceUsed) return
    setLifelines(prev => ({ ...prev, audience: false }))
    
    const votes = question.options.map((_, i) => {
      if (i === question.correct) return 40 + Math.floor(Math.random() * 30)
      return Math.floor(Math.random() * 20)
    })
    const total = votes.reduce((a, b) => a + b, 0)
    setAudienceVotes(votes.map(v => Math.round((v / total) * 100)))
    setIsAudienceUsed(false)
  }

  const resetGame = () => {
    setCurrentLevel(0)
    setSelectedAnswer(null)
    setIsAnswerLocked(false)
    setIsAnswerRevealed(false)
    setGameOver(false)
    setWon(false)
    setLifelines({ fifty: true, phone: true, audience: true })
    setHiddenOptions([])
    setPhoneHint(null)
    setAudienceVotes(null)
  }

  const walkAway = () => {
    if (currentLevel === 0) return
    setGameOver(true)
    saveScore(PRIZE_LEVELS[currentLevel - 1])
  }

  const handleLifelineClick = (key: keyof typeof LIFELINES) => {
    if (key === "fifty") setIsFiftyFiftyUsed(true)
    if (key === "phone") setIsPhoneUsed(true)
    if (key === "audience") setIsAudienceUsed(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-to-b from-[#00ff00]/5 via-background to-background -z-10" />
      <div className="fixed top-40 right-1/4 w-96 h-96 bg-[#ff00ff]/10 rounded-full blur-3xl -z-10" />

      <header className="p-4 border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Zpět
          </Link>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#00ff00]" style={{ filter: 'drop-shadow(0 0 5px #00ff00)' }} />
            <span className="font-bold text-[#00ff00]" style={{ textShadow: '0 0 5px #00ff00' }}>{currentPrize.toLocaleString()} perníků</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {!gameOver ? (
          <>
            {/* Prize Ladder */}
            <div className="mb-6 overflow-x-auto">
              <div className="flex gap-2 justify-center pb-2">
                {PRIZE_LEVELS.slice(0, 8).map((prize, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className={`text-xs whitespace-nowrap ${
                      i === currentLevel
                        ? "bg-primary/20 text-primary border-primary"
                        : i < currentLevel
                        ? "bg-success/20 text-success border-success/50"
                        : "bg-secondary/50 text-muted-foreground"
                    } ${(i === 4 || i === 9) ? "border-chart-4" : ""}`}
                  >
                    {prize.toLocaleString()}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Question */}
            <Card className="mb-6 border-primary/30 bg-gradient-to-b from-primary/10 to-card/50">
              <CardContent className="p-6">
                <Badge className="mb-4 bg-primary/20 text-primary border-primary/50">
                  Otázka za {currentPrize.toLocaleString()} perníků
                </Badge>
                <h2 className="text-xl md:text-2xl font-bold text-foreground text-balance">
                  {question.question}
                </h2>
              </CardContent>
            </Card>

            {/* Phone Hint */}
            {phoneHint && (
              <Card className="mb-4 border-accent/30 bg-accent/10">
                <CardContent className="p-4 flex items-start gap-3">
                  <PhoneCall className="h-5 w-5 text-accent mt-0.5" />
                  <p className="text-sm text-foreground">{phoneHint}</p>
                </CardContent>
              </Card>
            )}

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {question.options.map((option, index) => {
                const isHidden = hiddenOptions.includes(index)
                const isSelected = selectedAnswer === index
                const isCorrect = index === question.correct
                const showCorrect = isAnswerRevealed && isCorrect
                const showWrong = isAnswerRevealed && isSelected && !isCorrect

                return (
                  <button
                    key={index}
                    onClick={() => selectAnswer(index)}
                    disabled={isAnswerLocked || isHidden}
                    className={`relative p-4 rounded-xl text-left transition-all ${
                      isHidden
                        ? "opacity-30 cursor-not-allowed bg-secondary/30"
                        : showCorrect
                        ? "bg-success/20 border-2 border-success"
                        : showWrong
                        ? "bg-destructive/20 border-2 border-destructive"
                        : isSelected
                        ? "bg-primary/20 border-2 border-primary"
                        : "bg-card/50 border-2 border-border/50 hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-sm">
                        {["A", "B", "C", "D"][index]}
                      </span>
                      <span className="font-medium text-foreground">{option}</span>
                    </div>
                    {audienceVotes && !isHidden && (
                      <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent"
                          style={{ width: `${audienceVotes[index]}%` }}
                        />
                      </div>
                    )}
                    {audienceVotes && !isHidden && (
                      <span className="absolute top-2 right-3 text-xs text-muted-foreground">
                        {audienceVotes[index]}%
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={lockAnswer}
                disabled={selectedAnswer === null || isAnswerLocked}
                className="flex-1 bg-primary hover:bg-primary/90 neon-glow"
              >
                {isAnswerLocked ? "Vyhodnocuji..." : "Zamknout odpověď"}
              </Button>
              {currentLevel > 0 && (
                <Button
                  onClick={walkAway}
                  disabled={isAnswerLocked}
                  variant="outline"
                  className="border-chart-4/50 text-chart-4 hover:bg-chart-4/10 bg-transparent"
                >
                  Odejít s {PRIZE_LEVELS[currentLevel - 1].toLocaleString()}
                </Button>
              )}
            </div>

            {/* Lifelines */}
            <div className="mt-6 flex justify-center gap-3">
              {Object.entries(LIFELINES).map(([key, lifeline]) => {
                const Icon = lifeline.icon
                const available = lifelines[key as keyof typeof lifelines]
                return (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    disabled={!available || isAnswerLocked}
                    onClick={() => handleLifelineClick(key as keyof typeof LIFELINES)}
                    className={`gap-2 bg-transparent ${available ? "border-accent/50 hover:bg-accent/10" : "opacity-30"}`}
                  >
                    <Icon className="h-4 w-4" />
                    {lifeline.name}
                  </Button>
                )
              })}
            </div>
          </>
        ) : (
          <Card className={`border-${won ? "chart-4" : "destructive"}/50 bg-gradient-to-r ${won ? "from-chart-4/10 to-chart-4/5" : "from-destructive/10 to-destructive/5"}`}>
            <CardContent className="p-8 text-center">
              {won ? (
                <>
                  <Sparkles className="h-16 w-16 text-chart-4 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-foreground mb-2">VYHRÁVŠE!</h2>
                  <p className="text-5xl font-bold text-chart-4 neon-text mb-2">1,000,000</p>
                  <p className="text-xl text-chart-4 mb-6">perníků!</p>
                  <p className="text-muted-foreground mb-4">Jsi pravá ostravská smažka!</p>
                </>
              ) : (
                <>
                  <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-foreground mb-2">Konec hry</h2>
                  <p className="text-muted-foreground mb-2">Odcházíš s</p>
                  <p className="text-4xl font-bold text-chart-4 neon-text mb-6">
                    {safeHaven.toLocaleString()} perníků
                  </p>
                </>
              )}
              {user ? (
                <p className="text-success text-sm mb-6">Skóre uloženo!</p>
              ) : (
                <p className="text-muted-foreground text-sm mb-6">Přihlaš se pro uložení</p>
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
