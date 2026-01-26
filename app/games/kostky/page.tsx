"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Dices, Trophy, RotateCcw, X } from "lucide-react"
import type { User } from "@supabase/supabase-js"

type DiceValue = 1 | 2 | 3 | 4 | 5 | 6

interface Player {
  name: string
  score: number
  strikes: number
}

export default function KostkyPage() {
  const [user, setUser] = useState<User | null>(null)
  const [dice, setDice] = useState<DiceValue[]>([1, 2, 3, 4, 5, 6])
  const [selected, setSelected] = useState<boolean[]>([false, false, false, false, false, false])
  const [banking, setBanking] = useState<DiceValue[]>([])
  const [bankingScore, setBankingScore] = useState(0)
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [players, setPlayers] = useState<Player[]>([
    { name: "Hráč 1", score: 0, strikes: 0 },
    { name: "Hráč 2", score: 0, strikes: 0 }
  ])
  const [rollCount, setRollCount] = useState(0)
  const [rolling, setRolling] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [message, setMessage] = useState("Hoď kostkami pro zahájení tahu")
  const [canEndTurn, setCanEndTurn] = useState(false)
  const [firstRoll, setFirstRoll] = useState(true)
  const [specialOfferDice, setSpecialOfferDice] = useState<DiceValue[]>([])
  const [showSpecialOffer, setShowSpecialOffer] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [supabase.auth])

  const rollDice = () => {
    if (rolling) return
    
    setRolling(true)
    setMessage("Házení...")
    
    setTimeout(() => {
      const availableDice = dice.length - selected.filter(s => s).length
      const newDice = [...dice]
      
      for (let i = 0; i < dice.length; i++) {
        if (!selected[i]) {
          newDice[i] = (Math.floor(Math.random() * 6) + 1) as DiceValue
        }
      }
      
      setDice(newDice)
      setRollCount(prev => prev + 1)
      setRolling(false)
      
      const newRollCount = rollCount + 1
      
      // Check for special combinations only on first roll
      if (firstRoll) {
        checkSpecialCombinations(newDice)
      }
      
      // Check if player can select any dice
      const selectableDice = getSelectableDice(newDice, selected)
      if (selectableDice.every(s => !s)) {
        // No valid dice to select - turn over with 0 points
        endTurnWithZero()
        return
      }
      
      // Check third roll requirement
      if (newRollCount === 3 && bankingScore < 350) {
        setMessage("Nedosáhl jsi 350 bodů ve 3. hodu - 0 bodů za tah!")
        setTimeout(() => endTurnWithZero(), 2000)
        return
      }
      
      setMessage("Vyber kostky k odložení")
      setFirstRoll(false)
    }, 500)
  }

  const checkSpecialCombinations = (diceRoll: DiceValue[]) => {
    const sorted = [...diceRoll].sort()
    
    // Check for straight (1,2,3,4,5,6)
    if (sorted.join("") === "123456") {
      setMessage("Postupka! +2000 bodů!")
      setBankingScore(prev => prev + 2000)
      setBanking([...diceRoll])
      setSelected([true, true, true, true, true, true])
      setCanEndTurn(true)
      return
    }
    
    // Check for pairs (three different pairs)
    const counts = countDice(diceRoll)
    const pairs = Object.entries(counts).filter(([_, count]) => count === 2)
    if (pairs.length === 3) {
      setMessage("Tři páry! +700 bodů!")
      setBankingScore(prev => prev + 700)
      setBanking([...diceRoll])
      setSelected([true, true, true, true, true, true])
      setCanEndTurn(true)
      return
    }
    
    // Check for 5 dice toward straight or pairs
    const straightProgress = checkStraightProgress(diceRoll)
    const pairsProgress = checkPairsProgress(diceRoll)
    
    if (straightProgress.count >= 5 || pairsProgress >= 5) {
      setSpecialOfferDice(diceRoll)
      setShowSpecialOffer(true)
      setMessage("Máš možnost 'dohodit' poslední kostku!")
    }
  }

  const checkStraightProgress = (diceRoll: DiceValue[]) => {
    const unique = [...new Set(diceRoll)].sort()
    const needed = [1, 2, 3, 4, 5, 6].filter(n => !unique.includes(n as DiceValue))
    return { count: unique.length, needed }
  }

  const checkPairsProgress = (diceRoll: DiceValue[]) => {
    const counts = countDice(diceRoll)
    const pairs = Object.entries(counts).filter(([_, count]) => count === 2)
    return pairs.length * 2
  }

  const acceptSpecialOffer = () => {
    setShowSpecialOffer(false)
    // Freeze 5 dice and roll just one
    const tempSelected = [true, true, true, true, true, false]
    setSelected(tempSelected)
    setMessage("Dohazuješ poslední kostku...")
    rollDice()
  }

  const declineSpecialOffer = () => {
    setShowSpecialOffer(false)
    setMessage("Vyber kostky k odložení")
  }

  const countDice = (diceArray: DiceValue[]) => {
    const counts: Record<number, number> = {}
    diceArray.forEach(d => {
      counts[d] = (counts[d] || 0) + 1
    })
    return counts
  }

  const calculateDiceScore = (diceArray: DiceValue[], counts: Record<number, number>) => {
    let score = 0
    
    // Check combinations for each value
    for (const [value, count] of Object.entries(counts)) {
      const val = Number(value) as DiceValue
      
      if (val === 1) {
        if (count >= 6) score += 4000
        else if (count >= 5) score += 3000
        else if (count >= 4) score += 2000
        else if (count >= 3) score += 1000
        else score += count * 100 // 1x or 2x
      } else if (val === 5) {
        if (count >= 6) score += 2000
        else if (count >= 5) score += 1500
        else if (count >= 4) score += 1000
        else if (count >= 3) score += 500
        else score += count * 50 // 1x or 2x
      } else {
        // 2, 3, 4, 6 only score from 3+
        if (count >= 6) score += val * 400
        else if (count >= 5) score += val * 300
        else if (count >= 4) score += val * 200
        else if (count >= 3) score += val * 100
      }
    }
    
    return score
  }

  const getSelectableDice = (diceArray: DiceValue[], currentSelected: boolean[]) => {
    const counts = countDice(diceArray.filter((_, i) => !currentSelected[i]))
    const selectable = Array(6).fill(false)
    
    diceArray.forEach((die, i) => {
      if (currentSelected[i]) return
      
      // 1s and 5s always selectable (unless already part of 3+)
      if (die === 1 || die === 5) {
        const count = counts[die]
        if (count >= 3) {
          selectable[i] = true // Part of combination
        } else {
          selectable[i] = true // Individual scoring
        }
      } else {
        // 2, 3, 4, 6 only selectable if 3+ exist
        if (counts[die] >= 3) {
          selectable[i] = true
        }
      }
    })
    
    return selectable
  }

  const toggleSelectDie = (index: number) => {
    if (rolling || rollCount === 0) return
    
    const selectable = getSelectableDice(dice, selected)
    if (!selectable[index]) return
    
    const newSelected = [...selected]
    const dieValue = dice[index]
    
    // If selecting, check if it's part of a 3+ combination
    const unselectedDice = dice.filter((_, i) => !selected[i])
    const counts = countDice(unselectedDice)
    
    if (!newSelected[index] && counts[dieValue] >= 3) {
      // Select all dice of this value (combination)
      dice.forEach((d, i) => {
        if (d === dieValue && !selected[i]) {
          newSelected[i] = true
        }
      })
    } else {
      // Toggle single die (for 1s and 5s with count < 3)
      newSelected[index] = !newSelected[index]
    }
    
    setSelected(newSelected)
  }

  const bankSelected = () => {
    const selectedDice = dice.filter((_, i) => selected[i])
    if (selectedDice.length === 0) return
    
    const counts = countDice(selectedDice)
    const score = calculateDiceScore(selectedDice, counts)
    
    setBanking(prev => [...prev, ...selectedDice])
    setBankingScore(prev => prev + score)
    
    // Remove selected dice
    const remainingDice = dice.filter((_, i) => !selected[i])
    
    // If all dice selected, go "do plných"
    if (remainingDice.length === 0) {
      setMessage("Do plných! Hoď všemi kostkami")
      setDice([1, 2, 3, 4, 5, 6])
      setSelected([false, false, false, false, false, false])
      setCanEndTurn(false)
      setFirstRoll(true)
    } else {
      setDice(remainingDice as DiceValue[])
      setSelected(Array(remainingDice.length).fill(false))
      setMessage("Hoď zbývajícími kostkami nebo ukonči tah")
      setCanEndTurn(true)
    }
  }

  const endTurn = () => {
    if (!canEndTurn) return
    
    const newPlayers = [...players]
    newPlayers[currentPlayer].score += bankingScore
    newPlayers[currentPlayer].strikes = 0 // Reset strikes on successful turn
    setPlayers(newPlayers)
    
    if (user && currentPlayer === 0) {
      saveScore(newPlayers[0].score)
    }
    
    // Switch player
    const nextPlayer = (currentPlayer + 1) % 2
    setCurrentPlayer(nextPlayer)
    resetTurn()
    setMessage(`Hráč ${nextPlayer + 1} je na tahu`)
  }

  const endTurnWithZero = () => {
    const newPlayers = [...players]
    newPlayers[currentPlayer].strikes += 1
    
    if (newPlayers[currentPlayer].strikes >= 3) {
      newPlayers[currentPlayer].score = 0
      newPlayers[currentPlayer].strikes = 0
      setMessage(`Hráč ${currentPlayer + 1} má 3 čárky - skóre vynulováno!`)
    } else {
      setMessage(`0 bodů za tah! Čárka ${newPlayers[currentPlayer].strikes}/3`)
    }
    
    setPlayers(newPlayers)
    
    setTimeout(() => {
      const nextPlayer = (currentPlayer + 1) % 2
      setCurrentPlayer(nextPlayer)
      resetTurn()
      setMessage(`Hráč ${nextPlayer + 1} je na tahu`)
    }, 2000)
  }

  const resetTurn = () => {
    setDice([1, 2, 3, 4, 5, 6])
    setSelected([false, false, false, false, false, false])
    setBanking([])
    setBankingScore(0)
    setRollCount(0)
    setCanEndTurn(false)
    setFirstRoll(true)
    setShowSpecialOffer(false)
  }

  const saveScore = async (score: number) => {
    await supabase.from("game_scores").insert({
      user_id: user!.id,
      game_id: "kostky",
      score,
    })
  }

  const resetGame = () => {
    setPlayers([
      { name: "Hráč 1", score: 0, strikes: 0 },
      { name: "Hráč 2", score: 0, strikes: 0 }
    ])
    setCurrentPlayer(0)
    resetTurn()
    setMessage("Hoď kostkami pro zahájení tahu")
    setGameOver(false)
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
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Smažácký Kostky</h1>
          <p className="text-muted-foreground">{message}</p>
        </div>

        {/* Scoreboard */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {players.map((player, i) => (
            <Card 
              key={i}
              className={`border-2 transition-all ${
                currentPlayer === i 
                  ? "border-primary bg-primary/5" 
                  : "border-border/50 bg-card/30"
              }`}
            >
              <CardContent className="p-4">
                <div className="text-center">
                  <p className={`font-bold mb-2 ${currentPlayer === i ? "text-primary" : "text-muted-foreground"}`}>
                    {player.name}
                  </p>
                  <p className="text-3xl font-bold text-foreground mb-2">{player.score}</p>
                  <div className="flex gap-1 justify-center">
                    {Array.from({ length: player.strikes }).map((_, j) => (
                      <X key={j} className="h-4 w-4 text-destructive" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Banking Area */}
        {bankingScore > 0 && (
          <Card className="mb-4 border-chart-4/50 bg-chart-4/5">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Odložené body</p>
                <p className="text-2xl font-bold text-chart-4">{bankingScore}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Special Offer */}
        {showSpecialOffer && (
          <Card className="mb-4 border-primary bg-primary/10">
            <CardContent className="p-4">
              <p className="text-center mb-4">Máš 5/6 kostek pro speciální kombinaci! Chceš 'dohodit'?</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={acceptSpecialOffer} className="bg-primary">
                  Dohodit
                </Button>
                <Button onClick={declineSpecialOffer} variant="outline" className="bg-transparent">
                  Odmítnout
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dice Area */}
        <Card className="mb-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex justify-center gap-3 mb-6 flex-wrap">
              {dice.map((value, index) => {
                const selectable = getSelectableDice(dice, selected)
                const isSelectable = selectable[index] && rollCount > 0
                
                return (
                  <button
                    key={index}
                    onClick={() => toggleSelectDie(index)}
                    disabled={!isSelectable || rolling}
                    className={`relative w-16 h-16 md:w-20 md:h-20 rounded-xl text-3xl md:text-4xl font-bold transition-all border-2 ${
                      rolling
                        ? "animate-bounce bg-primary/20 text-primary border-primary/30"
                        : selected[index]
                        ? "bg-chart-4/20 text-chart-4 border-chart-4"
                        : isSelectable
                        ? "bg-primary/10 text-foreground border-primary/50 hover:bg-primary/20 cursor-pointer"
                        : "bg-secondary/50 text-muted-foreground border-border/30 cursor-not-allowed"
                    }`}
                  >
                    {value}
                  </button>
                )
              })}
            </div>

            <div className="flex justify-center gap-4 flex-wrap">
              <Button
                onClick={rollDice}
                disabled={rolling || showSpecialOffer || (rollCount > 0 && selected.every(s => !s))}
                className="bg-primary hover:bg-primary/90 neon-glow gap-2"
              >
                <Dices className="h-5 w-5" />
                Hodit
              </Button>
              
              {rollCount > 0 && selected.some(s => s) && (
                <Button
                  onClick={bankSelected}
                  disabled={rolling}
                  className="bg-chart-4 hover:bg-chart-4/90 gap-2"
                >
                  Odložit
                </Button>
              )}
              
              {canEndTurn && (
                <Button
                  onClick={endTurn}
                  disabled={rolling}
                  className="bg-success hover:bg-success/90 gap-2"
                >
                  <Trophy className="h-4 w-4" />
                  Ukončit tah
                </Button>
              )}
              
              <Button
                onClick={resetGame}
                variant="outline"
                className="border-border hover:bg-secondary gap-2 bg-transparent"
              >
                <RotateCcw className="h-4 w-4" />
                Nová hra
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Rules Summary */}
        <Card className="border-border/50 bg-card/30">
          <CardContent className="p-4">
            <h3 className="font-bold mb-2 text-foreground">Bodování:</h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• 1x jednička = 100b | 3x = 1000b | 4x = 2000b | 5x = 3000b | 6x = 4000b</p>
              <p>• 1x pětka = 50b | 3x = 500b | 4x = 1000b | 5x = 1500b | 6x = 2000b</p>
              <p>• 3x dvojka = 200b | 3x trojka = 300b | 3x čtyřka = 400b | 3x šestka = 600b</p>
              <p>• Postupka (1-6) = 2000b | 3 páry = 700b</p>
              <p>• Minimum 350b ve 3. hodu! | 3 čárky = reset skóre</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
