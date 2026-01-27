"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Dices, Trophy, RotateCcw, X, Users, Copy, Check } from "lucide-react"
import type { User } from "@supabase/supabase-js"

type DiceValue = 1 | 2 | 3 | 4 | 5 | 6

interface Player {
  name: string
  score: number
  strikes: number
}

interface GameState {
  id: string
  dice: DiceValue[]
  selected: boolean[]
  banking_score: number
  current_player: number
  players: Player[]
  roll_count: number
  message: string
  game_over: boolean
  host_id: string
  status: 'waiting' | 'playing' | 'finished'
}

export default function KostkyPage() {
  const [user, setUser] = useState<User | null>(null)
  const [mode, setMode] = useState<'menu' | 'local' | 'online'>('menu')
  const [gameStarted, setGameStarted] = useState(false)
  const [playerCount, setPlayerCount] = useState(2)
  
  // Local game state
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
  const [possiblePoints, setPossiblePoints] = useState<(number | null)[]>([null, null, null, null, null, null])
  const [hasRolledThisTurn, setHasRolledThisTurn] = useState(false)
  
  // Online multiplayer state
  const [gameId, setGameId] = useState<string | null>(null)
  const [joinGameId, setJoinGameId] = useState("")
  const [copied, setCopied] = useState(false)
  const [onlinePlayers, setOnlinePlayers] = useState<string[]>([])
  
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [supabase.auth])

  // Online multiplayer - listen to game changes
  useEffect(() => {
    if (!gameId || mode !== 'online') return

    const channel = supabase
      .channel(`game:${gameId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_sessions',
        filter: `id=eq.${gameId}`
      }, (payload) => {
        console.log('[v0] Game state changed:', payload)
        if (payload.new) {
          const gameState = payload.new as any
          setDice(gameState.dice)
          setSelected(gameState.selected)
          setBankingScore(gameState.banking_score)
          setCurrentPlayer(gameState.current_player)
          setPlayers(gameState.players)
          setRollCount(gameState.roll_count)
          setMessage(gameState.message)
          setGameOver(gameState.game_over)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId, mode, supabase])

  const createOnlineGame = async () => {
    if (!user) {
      setMessage("Musíš být přihlášen pro online hru")
      return
    }

    const newGameState: any = {
      dice: [1, 2, 3, 4, 5, 6],
      selected: [false, false, false, false, false, false],
      banking_score: 0,
      current_player: 0,
      players: [
        { name: user.email?.split('@')[0] || "Hráč 1", score: 0, strikes: 0 }
      ],
      roll_count: 0,
      message: "Čekání na další hráče...",
      game_over: false,
      host_id: user.id,
      status: 'waiting'
    }

    const { data, error } = await supabase
      .from('game_sessions')
      .insert(newGameState)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating game:', error)
      setMessage("Chyba při vytváření hry")
      return
    }

    setGameId(data.id)
    setMode('online')
    setOnlinePlayers([user.email?.split('@')[0] || "Hráč 1"])
    setMessage("Hra vytvořena! Sdílej ID s přáteli")
  }

  const joinOnlineGame = async () => {
    if (!user || !joinGameId) {
      setMessage("Musíš být přihlášen a zadat ID hry")
      return
    }

    const { data: game, error } = await supabase
      .from('game_sessions')
      .select()
      .eq('id', joinGameId)
      .single()

    if (error || !game) {
      setMessage("Hra nenalezena")
      return
    }

    const gameState = game as any
    const updatedPlayers = [
      ...gameState.players,
      { name: user.email?.split('@')[0] || `Hráč ${gameState.players.length + 1}`, score: 0, strikes: 0 }
    ]

    await supabase
      .from('game_sessions')
      .update({
        players: updatedPlayers,
        status: updatedPlayers.length >= 2 ? 'playing' : 'waiting',
        message: updatedPlayers.length >= 2 ? "Hoď kostkami pro zahájení tahu" : "Čekání na další hráče..."
      })
      .eq('id', joinGameId)

    setGameId(joinGameId)
    setMode('online')
    setPlayers(updatedPlayers)
    setGameStarted(true)
  }

  const updateGameState = async (updates: Partial<any>) => {
    if (!gameId) return

    await supabase
      .from('game_sessions')
      .update(updates)
      .eq('id', gameId)
  }

  const copyGameId = () => {
    if (gameId) {
      navigator.clipboard.writeText(gameId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const startLocalGame = (numPlayers: number) => {
    const newPlayers = Array.from({ length: numPlayers }, (_, i) => ({
      name: `Hráč ${i + 1}`,
      score: 0,
      strikes: 0
    }))
    setPlayers(newPlayers)
    setPlayerCount(numPlayers)
    setMode('local')
    setGameStarted(true)
  }

  const rollDice = async () => {
    if (rolling) return
    
    if (hasRolledThisTurn && rollCount > 0 && bankingScore === 0) {
      return
    }
    
    setRolling(true)
    setMessage("Házení...")
    setHasRolledThisTurn(true)
    
    setTimeout(async () => {
      const newDice = [...dice]
      
      for (let i = 0; i < dice.length; i++) {
        if (!selected[i]) {
          newDice[i] = (Math.floor(Math.random() * 6) + 1) as DiceValue
        }
      }
      
      setDice(newDice)
      const newRollCount = rollCount + 1
      setRollCount(newRollCount)
      setRolling(false)
      
      if (firstRoll) {
        checkSpecialCombinations(newDice)
      }
      
      const selectableDice = getSelectableDice(newDice, selected)
      if (selectableDice.every(s => !s)) {
        setMessage("Žádné body k odložení - 0 bodů za tah!")
        setPossiblePoints([null, null, null, null, null, null])
        setTimeout(() => endTurnWithZero(), 2000)
        return
      }
      
      if (newRollCount === 3 && bankingScore < 350) {
        setMessage("Nedosáhl jsi 350 bodů ve 3. hodu - 0 bodů za tah!")
        setPossiblePoints([null, null, null, null, null, null])
        setTimeout(() => endTurnWithZero(), 2000)
        return
      }
      
      calculatePossiblePoints(newDice, selected)
      
      setMessage("Klikni na kostky k odložení nebo ukonči tah")
      setFirstRoll(false)
      setCanEndTurn(bankingScore > 0)

      if (mode === 'online') {
        await updateGameState({
          dice: newDice,
          roll_count: newRollCount,
          message: "Klikni na kostky k odložení nebo ukonči tah"
        })
      }
    }, 800)
  }

  const calculatePossiblePoints = (diceArray: DiceValue[], currentSelected: boolean[]) => {
    const unselectedDice = diceArray.filter((_, i) => !currentSelected[i])
    const counts = countDice(unselectedDice)
    const points: (number | null)[] = Array(diceArray.length).fill(null)
    
    diceArray.forEach((die, i) => {
      if (currentSelected[i]) return
      
      const dieCount = counts[die]
      
      if (die === 1) {
        if (dieCount >= 6) points[i] = 4000
        else if (dieCount >= 5) points[i] = 3000
        else if (dieCount >= 4) points[i] = 2000
        else if (dieCount >= 3) points[i] = 1000
        else points[i] = 100
      } else if (die === 5) {
        if (dieCount >= 6) points[i] = 2000
        else if (dieCount >= 5) points[i] = 1500
        else if (dieCount >= 4) points[i] = 1000
        else if (dieCount >= 3) points[i] = 500
        else points[i] = 50
      } else {
        if (dieCount >= 6) points[i] = die * 400
        else if (dieCount >= 5) points[i] = die * 300
        else if (dieCount >= 4) points[i] = die * 200
        else if (dieCount >= 3) points[i] = die * 100
        else points[i] = null
      }
    })
    
    setPossiblePoints(points)
  }

  const checkSpecialCombinations = (diceRoll: DiceValue[]) => {
    const sorted = [...diceRoll].sort()
    
    if (sorted.join("") === "123456") {
      setMessage("Postupka! +2000 bodů!")
      setBankingScore(prev => prev + 2000)
      setBanking([...diceRoll])
      setSelected([true, true, true, true, true, true])
      setCanEndTurn(true)
      setPossiblePoints([null, null, null, null, null, null])
      return
    }
    
    const counts = countDice(diceRoll)
    const pairs = Object.entries(counts).filter(([_, count]) => count === 2)
    if (pairs.length === 3) {
      setMessage("Tři páry! +700 bodů!")
      setBankingScore(prev => prev + 700)
      setBanking([...diceRoll])
      setSelected([true, true, true, true, true, true])
      setCanEndTurn(true)
      setPossiblePoints([null, null, null, null, null, null])
      return
    }
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
    
    for (const [value, count] of Object.entries(counts)) {
      const val = Number(value) as DiceValue
      
      if (val === 1) {
        if (count >= 6) score += 4000
        else if (count >= 5) score += 3000
        else if (count >= 4) score += 2000
        else if (count >= 3) score += 1000
        else score += count * 100
      } else if (val === 5) {
        if (count >= 6) score += 2000
        else if (count >= 5) score += 1500
        else if (count >= 4) score += 1000
        else if (count >= 3) score += 500
        else score += count * 50
      } else {
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
      
      if (die === 1 || die === 5) {
        const count = counts[die]
        if (count >= 3) {
          selectable[i] = true
        } else {
          selectable[i] = true
        }
      } else {
        if (counts[die] >= 3) {
          selectable[i] = true
        }
      }
    })
    
    return selectable
  }

  const toggleSelectDie = async (index: number) => {
    if (rolling || rollCount === 0) return
    
    const selectable = getSelectableDice(dice, selected)
    if (!selectable[index]) return
    
    const newSelected = [...selected]
    const dieValue = dice[index]
    
    const unselectedDice = dice.filter((_, i) => !selected[i])
    const counts = countDice(unselectedDice)
    
    if (!newSelected[index] && counts[dieValue] >= 3) {
      dice.forEach((d, i) => {
        if (d === dieValue && !selected[i]) {
          newSelected[i] = true
        }
      })
    } else {
      newSelected[index] = !newSelected[index]
    }
    
    setSelected(newSelected)
    await bankDice(newSelected)
  }

  const bankDice = async (selectedDice: boolean[]) => {
    const selectedValues = dice.filter((_, i) => selectedDice[i])
    if (selectedValues.length === 0) return
    
    const counts = countDice(selectedValues)
    const score = calculateDiceScore(selectedValues, counts)
    
    setBanking(prev => [...prev, ...selectedValues])
    const newBankingScore = bankingScore + score
    setBankingScore(newBankingScore)
    setHasRolledThisTurn(false)
    
    const remainingDice = dice.filter((_, i) => !selectedDice[i])
    
    if (remainingDice.length === 0) {
      setMessage("Do plných! Hoď všemi kostkami nebo ukonči tah")
      setDice([1, 2, 3, 4, 5, 6])
      setSelected([false, false, false, false, false, false])
      setPossiblePoints([null, null, null, null, null, null])
      setCanEndTurn(true)
      setFirstRoll(true)

      if (mode === 'online') {
        await updateGameState({
          dice: [1, 2, 3, 4, 5, 6],
          selected: [false, false, false, false, false, false],
          banking_score: newBankingScore,
          message: "Do plných! Hoď všemi kostkami nebo ukonči tah"
        })
      }
    } else {
      const newDice = remainingDice as DiceValue[]
      setDice(newDice)
      setSelected(Array(newDice.length).fill(false))
      
      calculatePossiblePoints(newDice, Array(newDice.length).fill(false))
      
      setMessage("Hoď zbývajícími kostkami nebo ukonči tah")
      setCanEndTurn(true)

      if (mode === 'online') {
        await updateGameState({
          dice: newDice,
          selected: Array(newDice.length).fill(false),
          banking_score: newBankingScore,
          message: "Hoď zbývajícími kostkami nebo ukonči tah"
        })
      }
    }
  }

  const endTurn = async () => {
    if (!canEndTurn) return
    
    if (rollCount >= 3 && bankingScore < 350) {
      setMessage("Nemůžeš ukončit tah - máš méně než 350 bodů ve 3. hodu!")
      return
    }
    
    const newPlayers = [...players]
    newPlayers[currentPlayer].score += bankingScore
    newPlayers[currentPlayer].strikes = 0
    setPlayers(newPlayers)
    
    if (user && currentPlayer === 0 && mode === 'local') {
      saveScore(newPlayers[0].score)
    }
    
    const nextPlayer = (currentPlayer + 1) % players.length
    setCurrentPlayer(nextPlayer)
    resetTurn()
    setMessage(`Hráč ${nextPlayer + 1} je na tahu`)

    if (mode === 'online') {
      await updateGameState({
        players: newPlayers,
        current_player: nextPlayer,
        dice: [1, 2, 3, 4, 5, 6],
        selected: [false, false, false, false, false, false],
        banking_score: 0,
        roll_count: 0,
        message: `${newPlayers[nextPlayer].name} je na tahu`
      })
    }
  }

  const endTurnWithZero = async () => {
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
    
    setTimeout(async () => {
      const nextPlayer = (currentPlayer + 1) % players.length
      setCurrentPlayer(nextPlayer)
      resetTurn()
      setMessage(`Hráč ${nextPlayer + 1} je na tahu`)

      if (mode === 'online') {
        await updateGameState({
          players: newPlayers,
          current_player: nextPlayer,
          dice: [1, 2, 3, 4, 5, 6],
          selected: [false, false, false, false, false, false],
          banking_score: 0,
          roll_count: 0,
          message: `${newPlayers[nextPlayer].name} je na tahu`
        })
      }
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
    setPossiblePoints([null, null, null, null, null, null])
    setHasRolledThisTurn(false)
  }

  const saveScore = async (score: number) => {
    await supabase.from("game_scores").insert({
      user_id: user!.id,
      game_id: "kostky",
      score,
    })
  }

  const resetGame = () => {
    const newPlayers = Array.from({ length: players.length }, (_, i) => ({
      name: `Hráč ${i + 1}`,
      score: 0,
      strikes: 0
    }))
    setPlayers(newPlayers)
    setCurrentPlayer(0)
    resetTurn()
    setMessage("Hoď kostkami pro zahájení tahu")
    setGameOver(false)
  }

  const backToMenu = () => {
    setMode('menu')
    setGameStarted(false)
    setGameId(null)
    resetGame()
  }

  // Main menu
  if (mode === 'menu') {
    return (
      <div className="min-h-screen bg-background pt-12">
        <div className="fixed inset-0 bg-gradient-to-b from-[#00ff00]/5 via-background to-background -z-10" />

        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center mb-12">
            <Dices className="h-16 w-16 text-[#00ff00] mx-auto mb-4" style={{ filter: 'drop-shadow(0 0 10px #00ff00)' }} />
            <h1 className="text-4xl font-bold text-[#00ff00] mb-4" style={{ textShadow: '0 0 10px #00ff00, 0 0 20px #00ff00' }}>Smažácký Kostky</h1>
            <p className="text-muted-foreground">Vyber herní režim</p>
          </div>

          <div className="space-y-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 text-foreground">Lokální hra</h3>
                <p className="text-sm text-muted-foreground mb-4">Hraj na jednom zařízení s přáteli</p>
                <div className="space-y-2">
                  {[2, 3, 4, 5, 6].map((num) => (
                    <Button
                      key={num}
                      onClick={() => startLocalGame(num)}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {num} Hráči
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 text-foreground">Online multiplayer</h3>
                <p className="text-sm text-muted-foreground mb-4">Hraj s přáteli na různých zařízeních</p>
                
                {!user ? (
                  <p className="text-sm text-destructive">Musíš být přihlášen pro online hru</p>
                ) : (
                  <div className="space-y-3">
                    <Button
                      onClick={createOnlineGame}
                      className="w-full bg-[#ff00ff] hover:bg-[#ff00ff]/90 text-white"
                      style={{ boxShadow: '0 0 10px #ff00ff' }}
                    >
                      Vytvořit hru
                    </Button>
                    <div className="flex gap-2">
                      <Input
                        placeholder="ID hry"
                        value={joinGameId}
                        onChange={(e) => setJoinGameId(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={joinOnlineGame} variant="outline" className="bg-transparent">
                        Připojit
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/50 bg-card/30 mt-6">
            <CardContent className="p-4">
              <h3 className="font-bold mb-2 text-foreground">Pravidla:</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Cílem je získat co nejvíce bodů házením kostek</p>
                <p>• Ve 3. hodu musíš mít minimálně 350 bodů</p>
                <p>• 3 nulové tahy za sebou = reset skóre na 0</p>
                <p>• Odložením všech kostek házíš "do plných"</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // Online game lobby
  if (mode === 'online' && gameId && !gameStarted) {
    return (
      <div className="min-h-screen bg-background pt-12">
        <div className="fixed inset-0 bg-gradient-to-b from-primary/5 via-background to-background -z-10" />

        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">Online hra vytvořena</h1>
            <p className="text-muted-foreground">Sdílej ID s přáteli</p>
          </div>

          <Card className="border-primary/50 bg-primary/5 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ID hry:</p>
                  <p className="text-xl font-mono font-bold text-foreground">{gameId}</p>
                </div>
                <Button onClick={copyGameId} variant="outline" size="icon" className="bg-transparent">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 mb-6">
            <CardContent className="p-6">
              <h3 className="font-bold mb-4 text-foreground">Hráči v lobby ({onlinePlayers.length})</h3>
              <div className="space-y-2">
                {onlinePlayers.map((player, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-secondary/50 rounded">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-foreground">{player}</span>
                    {i === 0 && <Badge variant="outline">Host</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={() => setGameStarted(true)} className="flex-1 bg-primary hover:bg-primary/90">
              Začít hru
            </Button>
            <Button onClick={backToMenu} variant="outline" className="bg-transparent">
              Zrušit
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // Game screen
  return (
    <div className="min-h-screen bg-background pt-12">
      <div className="fixed inset-0 bg-gradient-to-b from-primary/5 via-background to-background -z-10" />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={backToMenu}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Menu
          </button>
          {mode === 'online' && gameId && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">{gameId.slice(0, 8)}</Badge>
            </div>
          )}
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Smažácký Kostky</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        {/* Scoreboard */}
        <div className={`grid gap-3 mb-6 ${players.length === 2 ? 'grid-cols-2' : players.length === 3 ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-3'}`}>
          {players.map((player, i) => (
            <Card 
              key={i}
              className={`border-2 transition-all ${
                currentPlayer === i 
                  ? "border-primary bg-primary/5" 
                  : "border-border/50 bg-card/30"
              }`}
            >
              <CardContent className="p-3">
                <div className="text-center">
                  <p className={`font-bold text-sm mb-2 ${currentPlayer === i ? "text-primary" : "text-muted-foreground"}`}>
                    {player.name}
                  </p>
                  <p className="text-2xl font-bold text-foreground mb-2">{player.score}</p>
                  <div className="flex gap-1 justify-center">
                    {Array.from({ length: player.strikes }).map((_, j) => (
                      <X key={j} className="h-3 w-3 text-destructive" />
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
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Odložené body</p>
                <p className="text-xl font-bold text-chart-4">{bankingScore}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dice Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6 max-w-md mx-auto">
          {dice.map((die, i) => (
            <button
              key={i}
              onClick={() => toggleSelectDie(i)}
              disabled={rolling || rollCount === 0 || selected[i]}
              className={`relative aspect-square rounded-xl flex items-center justify-center text-4xl font-bold transition-all
                ${rolling && !selected[i] ? 'animate-spin' : ''}
                ${selected[i] 
                  ? 'bg-secondary/30 text-muted-foreground cursor-not-allowed' 
                  : getSelectableDice(dice, selected)[i]
                    ? 'bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer border-2 border-primary'
                    : 'bg-card/50 text-muted-foreground cursor-not-allowed'
                }`}
            >
              {die}
              {possiblePoints[i] !== null && !selected[i] && (
                <Badge className="absolute -top-2 -right-2 bg-chart-4 text-xs">
                  +{possiblePoints[i]}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex gap-3 max-w-md mx-auto">
          <Button
            onClick={rollDice}
            disabled={rolling || (rollCount > 0 && !canEndTurn)}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            <Dices className="h-4 w-4 mr-2" />
            Hodit ({rollCount}/3)
          </Button>
          <Button
            onClick={endTurn}
            disabled={!canEndTurn || rollCount >= 3 && bankingScore < 350}
            variant="outline"
            className="flex-1 bg-transparent"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Ukončit tah
          </Button>
        </div>
      </main>
    </div>
  )
}
