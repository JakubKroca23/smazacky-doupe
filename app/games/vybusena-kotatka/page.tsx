"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, RotateCcw, Trophy, Flame, AlertTriangle } from "lucide-react"

interface GameCard {
  id: number
  type: "bomb" | "defuse" | "skip" | "shield" | "normal"
  revealed: boolean
}

type GameState = "playing" | "gameOver" | "victory"

function createDeck(): GameCard[] {
  const deck: GameCard[] = []
  
  // 1 bomba (instant game over)
  deck.push({ id: 0, type: "bomb", revealed: false })
  
  // 2 defuse karty (ochrany před bombou)
  deck.push({ id: 1, type: "defuse", revealed: false })
  deck.push({ id: 2, type: "defuse", revealed: false })
  
  // 3 skip karty (přeskoči tah)
  deck.push({ id: 3, type: "skip", revealed: false })
  deck.push({ id: 4, type: "skip", revealed: false })
  deck.push({ id: 5, type: "skip", revealed: false })
  
  // 2 shield karty (ochrana)
  deck.push({ id: 6, type: "shield", revealed: false })
  deck.push({ id: 7, type: "shield", revealed: false })
  
  // 15 normálních karet (bezpečné karty)
  for (let i = 8; i < 23; i++) {
    deck.push({ id: i, type: "normal", revealed: false })
  }
  
  // Zamíchej balíček
  return deck.sort(() => Math.random() - 0.5)
}

function getCardDisplay(type: string) {
  switch (type) {
    case "bomb":
      return { label: "BOMBA!", emoji: "💣", color: "text-red-500" }
    case "defuse":
      return { label: "DEFUSE", emoji: "⚙️", color: "text-blue-400" }
    case "skip":
      return { label: "SKIP", emoji: "⏭️", color: "text-yellow-400" }
    case "shield":
      return { label: "ŠTÍT", emoji: "🛡️", color: "text-green-400" }
    case "normal":
      return { label: "BEZPEČNÁ", emoji: "😻", color: "text-purple-400" }
    default:
      return { label: "?", emoji: "❓", color: "text-gray-400" }
  }
}

export default function VybusenaKotatka() {
  const [deck, setDeck] = useState<GameCard[]>([])
  const [score, setScore] = useState(0)
  const [gameState, setGameState] = useState<GameState>("playing")
  const [cardsDrawn, setCardsDrawn] = useState(0)
  const [message, setMessage] = useState("")
  const [highScore, setHighScore] = useState<number | null>(null)
  const [hasShield, setHasShield] = useState(false)
  const [shieldsUsed, setShieldsUsed] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    setDeck(createDeck())
    loadHighScore()
  }, [])

  const loadHighScore = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("game_scores")
      .select("score")
      .eq("user_id", user.id)
      .eq("game_id", "vybusena_kotatka")
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
      game_id: "vybusena_kotatka",
      score: finalScore,
      metadata: { cardsDrawn, shields: shieldsUsed },
    })

    if (!highScore || finalScore > highScore) {
      setHighScore(finalScore)
    }
  }, [supabase, highScore, cardsDrawn, shieldsUsed])

  const drawCard = () => {
    if (gameState !== "playing") return

    const unrevealedCards = deck.filter(c => !c.revealed)
    if (unrevealedCards.length === 0) {
      setGameState("victory")
      setMessage("🎉 Vítězství! Vytáhl jsi všechny karty!")
      saveScore(score + 1000)
      return
    }

    const cardIndex = Math.floor(Math.random() * unrevealedCards.length)
    const selectedCard = unrevealedCards[cardIndex]
    const deckIndex = deck.findIndex(c => c.id === selectedCard.id)

    setDeck(prev =>
      prev.map(card =>
        card.id === selectedCard.id ? { ...card, revealed: true } : card
      )
    )

    const display = getCardDisplay(selectedCard.type)

    if (selectedCard.type === "bomb") {
      if (hasShield) {
        setMessage("🛡️ Štít ti zachránil! Bomba neutralizována!")
        setHasShield(false)
        setShieldsUsed(s => s + 1)
        setScore(prev => prev + 50)
        setCardsDrawn(prev => prev + 1)
      } else {
        setGameState("gameOver")
        setMessage("💥 BOOM! Vytáhl jsi bombu!")
        saveScore(score)
      }
    } else if (selectedCard.type === "defuse") {
      setMessage("⚙️ Defuse! Příští bomba ti neuškodí!")
      setHasShield(true)
      setScore(prev => prev + 100)
      setCardsDrawn(prev => prev + 1)
    } else if (selectedCard.type === "skip") {
      setMessage("⏭️ Skip! Žádné body, ale pokračuješ!")
      setScore(prev => prev + 25)
      setCardsDrawn(prev => prev + 1)
    } else if (selectedCard.type === "shield") {
      setMessage("🛡️ Štít! Máš ochranu!")
      setHasShield(true)
      setScore(prev => prev + 75)
      setCardsDrawn(prev => prev + 1)
    } else {
      setMessage("😻 Bezpečná! +10 bodů!")
      setScore(prev => prev + 10)
      setCardsDrawn(prev => prev + 1)
    }
  }

  const resetGame = () => {
    setDeck(createDeck())
    setScore(0)
    setGameState("playing")
    setCardsDrawn(0)
    setMessage("")
    setHasShield(false)
    setShieldsUsed(0)
  }

  const revealedCount = deck.filter(c => c.revealed).length
  const totalCards = deck.length

  return (
    <div className="min-h-screen bg-background">
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#ff00ff]/5 via-background to-[#0088ff]/5 -z-10" />
      <div className="fixed top-40 right-1/4 w-80 h-80 bg-[#ff0055]/10 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-20 left-1/3 w-96 h-96 bg-[#00ff00]/10 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Zpět na hry</span>
          </Link>

          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[#ff0055]" style={{ filter: 'drop-shadow(0 0 5px #ff0055)' }} />
            <span className="font-bold text-lg text-[#ff0055]" style={{ textShadow: '0 0 5px #ff0055' }}>Vybušená Koťátka</span>
          </div>

          <Button variant="ghost" size="sm" onClick={resetGame} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Nová hra</span>
          </Button>
        </div>
      </header>

      {/* Stats */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Badge variant="outline" className="bg-secondary/50 gap-2 px-3 py-1.5">
            <Flame className="h-3.5 w-3.5 text-[#ff0055]" style={{ filter: 'drop-shadow(0 0 5px #ff0055)' }} />
            <span className="text-[#ff0055]">Skóre: {score}</span>
          </Badge>
          <Badge variant="outline" className="bg-secondary/50 gap-2 px-3 py-1.5">
            <span className="text-[#00ff00]">Karet: {revealedCount}/{totalCards}</span>
          </Badge>
          <Badge variant="outline" className={`bg-secondary/50 gap-2 px-3 py-1.5 ${hasShield ? "border-[#00ff00]" : ""}`}>
            <span className={hasShield ? "text-[#00ff00]" : "text-muted-foreground"}>
              {hasShield ? "🛡️ Chráněn" : "Bez ochrany"}
            </span>
          </Badge>
          {highScore !== null && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 gap-2 px-3 py-1.5">
              <Trophy className="h-3.5 w-3.5" />
              Best: {highScore.toLocaleString()}
            </Badge>
          )}
        </div>
      </div>

      {/* Main Game Area */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto">
          {/* Message Box */}
          {message && (
            <Card className="mb-8 border-primary/50 bg-primary/10">
              <CardContent className="p-6 text-center">
                <p className="text-lg font-bold text-primary">{message}</p>
              </CardContent>
            </Card>
          )}

          {/* Game Status */}
          {gameState === "playing" && (
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <p className="text-muted-foreground">Zbývá karet:</p>
                <p className="text-4xl font-bold text-[#00ff00]">
                  {totalCards - revealedCount}
                </p>
              </div>

              {/* Draw Button */}
              <Button
                onClick={drawCard}
                size="lg"
                className="w-full bg-gradient-to-r from-[#ff0055] to-[#ff00ff] hover:from-[#ff0055] hover:to-[#ff00ff] text-white font-bold text-lg h-16 neon-glow-pink"
              >
                TAHEJ KARTU 🎴
              </Button>

              {/* Card Distribution Info */}
              <div className="grid grid-cols-2 gap-3 mt-8 text-sm">
                <div className="bg-secondary/50 p-3 rounded-lg">
                  <p className="text-muted-foreground">Bezpečné</p>
                  <p className="text-[#00ff00] font-bold">15</p>
                </div>
                <div className="bg-secondary/50 p-3 rounded-lg">
                  <p className="text-muted-foreground">Bomby</p>
                  <p className="text-[#ff0055] font-bold">1</p>
                </div>
                <div className="bg-secondary/50 p-3 rounded-lg">
                  <p className="text-muted-foreground">Defuse</p>
                  <p className="text-[#0088ff] font-bold">2</p>
                </div>
                <div className="bg-secondary/50 p-3 rounded-lg">
                  <p className="text-muted-foreground">Skip/Štít</p>
                  <p className="text-[#00ff00] font-bold">5</p>
                </div>
              </div>
            </div>
          )}

          {/* Game Over Modal */}
          {gameState === "gameOver" && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-sm border-[#ff0055]/50 bg-card">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="text-6xl">💣</div>
                  <h2 className="text-2xl font-bold text-[#ff0055]">GAME OVER!</h2>
                  <p className="text-muted-foreground">
                    Vytáhl jsi bombu po {cardsDrawn} kartách
                  </p>
                  <div className="text-3xl font-bold text-[#ff0055]" style={{ textShadow: '0 0 10px #ff0055' }}>
                    Skóre: {score}
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button onClick={resetGame} className="flex-1 bg-[#ff0055] hover:bg-[#ff0055]/90">
                      Hrát znovu
                    </Button>
                    <Link href="/" className="flex-1">
                      <Button variant="outline" className="w-full border-border bg-transparent">
                        Domů
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Victory Modal */}
          {gameState === "victory" && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-sm border-[#00ff00]/50 bg-card">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="relative inline-block">
                    <Trophy className="h-16 w-16 text-[#00ff00] mx-auto" style={{ filter: 'drop-shadow(0 0 10px #00ff00)' }} />
                  </div>
                  <h2 className="text-2xl font-bold text-[#00ff00]">VÍTĚZSTVÍ!</h2>
                  <p className="text-muted-foreground">
                    Úspěšně jsi vytáhl všech {totalCards} karet!
                  </p>
                  <div className="text-3xl font-bold text-[#00ff00]" style={{ textShadow: '0 0 10px #00ff00' }}>
                    Skóre: {score}
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button onClick={resetGame} className="flex-1 bg-[#00ff00] hover:bg-[#00ff00]/90 text-black font-bold">
                      Hrát znovu
                    </Button>
                    <Link href="/" className="flex-1">
                      <Button variant="outline" className="w-full border-border bg-transparent">
                        Domů
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
