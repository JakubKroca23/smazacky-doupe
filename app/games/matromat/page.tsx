'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getSmazeBalance, updateSmaze, resetSmaze } from '@/app/actions/currency'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Coins, RotateCcw, Menu } from 'lucide-react'
import { audioManager } from '@/lib/audio-manager'
import type { User } from '@supabase/supabase-js'

const SYMBOLS = ['🍉', '🍇', '🍋', '🍊', '7️⃣', '💎', '🍒', 'BAR']

const SYMBOL_VALUES: Record<string, number> = {
  '🍉': 2,
  '🍇': 3,
  '🍋': 2,
  '🍊': 2,
  '7️⃣': 15,
  '💎': 50,
  '🍒': 4,
  'BAR': 10,
}

type Reel = string[]

export default function MatromatPage() {
  const [user, setUser] = useState<User | null>(null)
  const [smaze, setSmaze] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [bet, setBet] = useState(100)
  const [reels, setReels] = useState<Reel[]>([
    Array(3).fill('🍉'),
    Array(3).fill('🍇'),
    Array(3).fill('🍋'),
    Array(3).fill('🍊'),
    Array(3).fill('7️⃣'),
  ])
  const [spinning, setSpinning] = useState(false)
  const [lastWin, setLastWin] = useState(0)
  const [totalWinnings, setTotalWinnings] = useState(0)
  const [reelSpinning, setReelSpinning] = useState<boolean[]>([false, false, false, false, false])
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { balance } = await getSmazeBalance()
        setSmaze(balance)
      }
      
      setLoading(false)
    }
    
    loadData()
  }, [supabase.auth])

  const spin = async () => {
    if (smaze < bet || spinning) return

    setSpinning(true)
    setLastWin(0)
    audioManager.playSound('dice')

    // Deduct bet
    const { balance: newBalance, error } = await updateSmaze(-bet)
    if (error) {
      setSpinning(false)
      return
    }
    setSmaze(newBalance)

    // Animate each reel stopping one by one
    const newReels: Reel[] = []
    const spinningState = [true, true, true, true, true]
    setReelSpinning(spinningState)

    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 500 + i * 300))
      
      // Generate random symbols for this reel
      const reelSymbols = Array(3).fill(null).map(() => 
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
      )
      newReels.push(reelSymbols)
      
      // Stop this reel
      spinningState[i] = false
      setReelSpinning([...spinningState])
      setReels([...newReels, ...Array(5 - newReels.length).fill(reels[0])])
      audioManager.playSound('click')
    }

    setReels(newReels)
    setSpinning(false)
    await calculateWin(newReels)
  }

  const calculateWin = async (finalReels: Reel[]) => {
    let totalWin = 0

    // Check all 3 horizontal lines
    for (let row = 0; row < 3; row++) {
      const line = finalReels.map(reel => reel[row])
      const firstSymbol = line[0]
      
      // Count matching symbols from left
      let matchCount = 1
      for (let i = 1; i < line.length; i++) {
        if (line[i] === firstSymbol) {
          matchCount++
        } else {
          break
        }
      }

      if (matchCount >= 3) {
        const symbolValue = SYMBOL_VALUES[firstSymbol] || 1
        let multiplier = 1
        if (matchCount === 3) multiplier = 1
        if (matchCount === 4) multiplier = 5
        if (matchCount === 5) multiplier = 20

        totalWin += bet * multiplier * symbolValue
      }
    }

    // Check diagonals
    const diagonal1 = finalReels.map((reel, i) => reel[i < 3 ? i : 2])
    const diagonal2 = finalReels.map((reel, i) => reel[i < 3 ? 2 - i : 0])
    
    for (const diagonal of [diagonal1, diagonal2]) {
      const firstSymbol = diagonal[0]
      let matchCount = 1
      for (let i = 1; i < diagonal.length; i++) {
        if (diagonal[i] === firstSymbol) {
          matchCount++
        } else {
          break
        }
      }

      if (matchCount >= 3) {
        const symbolValue = SYMBOL_VALUES[firstSymbol] || 1
        let multiplier = matchCount === 3 ? 1 : matchCount === 4 ? 5 : 20
        totalWin += bet * multiplier * symbolValue
      }
    }

    if (totalWin > 0) {
      setLastWin(totalWin)
      setTotalWinnings(prev => prev + totalWin)
      audioManager.playSound('win')

      const { balance: newBalance } = await updateSmaze(totalWin)
      setSmaze(newBalance)

      if (user) {
        await supabase.from('game_scores').insert({
          user_id: user.id,
          game_id: 'matromat',
          score: totalWin,
        })
      }
    }
  }

  const adjustBet = (amount: number) => {
    if (spinning) return
    const newBet = bet + amount
    setBet(Math.max(50, Math.min(500, newBet)))
    audioManager.playSound('click')
  }

  const handleReset = async () => {
    const { balance } = await resetSmaze()
    setSmaze(balance)
    setBet(100)
    setLastWin(0)
    setTotalWinnings(0)
    audioManager.playSound('click')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-white">Načítám...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-red-900/20 via-[#0a0a0a] to-[#0a0a0a] -z-10" />

      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 px-4">
          <Link href="/" className="text-white/60 hover:text-white transition-colors flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            Zpět
          </Link>
          <div className="flex items-center gap-3">
            <Coins className="h-6 w-6 text-yellow-400" />
            <span className="text-2xl font-bold text-yellow-400">
              {smaze.toLocaleString()} Kč
            </span>
          </div>
        </div>

        {/* Slot Machine */}
        <div className="relative">
          {/* Red metallic frame */}
          <div className="bg-gradient-to-b from-red-700 via-red-600 to-red-800 rounded-3xl p-8 shadow-2xl border-8 border-red-900/50" style={{ boxShadow: '0 0 60px rgba(220, 38, 38, 0.5), inset 0 2px 20px rgba(0, 0, 0, 0.5)' }}>
            
            {/* Top logo */}
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-2xl px-8 py-4 border-4 border-yellow-600 shadow-xl relative">
                <div className="absolute inset-0 rounded-2xl border-2 border-yellow-200 opacity-50" />
                <div className="relative">
                  <div className="text-red-600 font-black text-xl tracking-wider">MULTIPLAY</div>
                  <div className="text-white font-black text-5xl tracking-tight leading-none" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                    61
                  </div>
                </div>
                {/* Lights effect */}
                <div className="absolute -inset-1 rounded-2xl opacity-30 blur-sm bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 animate-pulse -z-10" />
              </div>
            </div>

            {/* Side labels */}
            <div className="flex items-center gap-4">
              {/* Left side */}
              <div className="flex flex-col gap-2">
                <div className="writing-mode-vertical text-amber-400 font-bold text-xl tracking-widest" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', letterSpacing: '0.3em' }}>
                  LINES WHEEL
                </div>
              </div>

              {/* Reels container */}
              <div className="flex-1 bg-black rounded-xl p-6 shadow-inner relative overflow-hidden">
                {/* Scanline effect */}
                <div className="absolute inset-0 pointer-events-none opacity-20" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)' }} />
                
                <div className="grid grid-cols-5 gap-4 relative z-10">
                  {reels.map((reel, reelIndex) => (
                    <div key={reelIndex} className="flex flex-col gap-2">
                      {reel.map((symbol, symbolIndex) => (
                        <div
                          key={`${reelIndex}-${symbolIndex}`}
                          className={`
                            bg-gradient-to-b from-gray-900 via-black to-gray-900
                            rounded-lg border-2 border-gray-700
                            aspect-square flex items-center justify-center
                            text-6xl font-bold
                            transition-all duration-200
                            ${reelSpinning[reelIndex] ? 'animate-slot-spin blur-sm' : 'hover:scale-105'}
                          `}
                          style={{
                            boxShadow: reelSpinning[reelIndex] 
                              ? 'inset 0 2px 8px rgba(0,0,0,0.8)' 
                              : 'inset 0 2px 8px rgba(0,0,0,0.5), 0 0 20px rgba(0,255,0,0.1)',
                            animation: reelSpinning[reelIndex] ? 'slot-spin 0.1s linear infinite' : 'none'
                          }}
                        >
                          {symbol === 'BAR' ? (
                            <div className="bg-gradient-to-r from-gray-300 via-white to-gray-300 text-black font-black text-2xl px-4 py-2 rounded-lg border-2 border-gray-400">
                              BAR
                            </div>
                          ) : (
                            <span className="drop-shadow-lg">{symbol}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right side */}
              <div className="flex flex-col gap-2">
                <div className="writing-mode-vertical text-amber-400 font-bold text-xl tracking-widest" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', letterSpacing: '0.3em' }}>
                  WHEEL LINES
                </div>
              </div>
            </div>

            {/* Bottom controls */}
            <div className="mt-6 bg-gradient-to-b from-gray-900 to-black rounded-xl p-6 border-2 border-gray-800">
              <div className="flex items-center justify-between">
                {/* Menu */}
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <Menu className="h-8 w-8" />
                </Button>

                {/* Win display */}
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-1">Výhra:</div>
                  <div className="text-4xl font-bold text-red-500 animate-pulse">
                    {lastWin} Kč
                  </div>
                </div>

                {/* Bet controls */}
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-2">Sázka</div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => adjustBet(-50)}
                      disabled={spinning || bet <= 50}
                      size="icon"
                      variant="outline"
                      className="bg-gradient-to-b from-red-600 to-red-700 border-red-500 hover:from-red-500 hover:to-red-600 text-white"
                    >
                      <span className="text-xl">▼</span>
                    </Button>
                    <div className="text-4xl font-bold text-red-500 min-w-[120px]">
                      {bet} Kč
                    </div>
                    <Button
                      onClick={() => adjustBet(50)}
                      disabled={spinning || bet >= 500}
                      size="icon"
                      variant="outline"
                      className="bg-gradient-to-b from-red-600 to-red-700 border-red-500 hover:from-red-500 hover:to-red-600 text-white"
                    >
                      <span className="text-xl">▲</span>
                    </Button>
                  </div>
                </div>

                {/* Replay button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                  className="text-white hover:bg-white/10"
                >
                  <RotateCcw className="h-8 w-8" />
                </Button>

                {/* Spin button */}
                <Button
                  onClick={spin}
                  disabled={smaze < bet || spinning}
                  size="lg"
                  className="h-24 w-24 rounded-full bg-gradient-to-b from-red-500 via-red-600 to-red-700 border-8 border-red-800 hover:from-red-400 hover:via-red-500 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl"
                  style={{ boxShadow: spinning ? '0 0 40px rgba(239, 68, 68, 0.8)' : '0 0 30px rgba(239, 68, 68, 0.5)' }}
                >
                  <div className="text-white font-black text-xl tracking-wider" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                    {spinning ? '...' : 'SPIN'}
                  </div>
                </Button>
              </div>

              {/* Credits display */}
              <div className="mt-4 text-center">
                <div className="text-lg text-gray-400">
                  Kredity: <span className="text-2xl font-bold text-yellow-400">{smaze.toLocaleString()} Kč</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Celkové výhry: <span className="text-green-400 font-bold">{totalWinnings.toLocaleString()} Kč</span>
                </div>
              </div>

              {smaze < bet && (
                <div className="mt-4 text-center">
                  <Button onClick={handleReset} variant="destructive" className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Reset (2000 Kč)
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* ID number */}
          <div className="absolute bottom-2 left-8 text-xs text-gray-600 font-mono">
            1203428980296<invoke name="1" />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>3+ stejných symbolů na linii = výhra • 5 stejných = mega výhra!</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes slot-spin {
          from { transform: translateY(0); }
          to { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  )
}
