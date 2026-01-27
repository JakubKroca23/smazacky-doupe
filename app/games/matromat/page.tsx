'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei'
import { createClient } from '@/lib/supabase/client'
import { getSmazeBalance, updateSmaze, resetSmaze } from '@/app/actions/currency'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Coins, RotateCcw, Sparkles, Plus, Minus, Loader2 } from 'lucide-react'
import { audioManager } from '@/lib/audio-manager'
import { SlotReel3D } from '@/components/slot-reel-3d'
import type { User } from '@supabase/supabase-js'

const SYMBOLS = ['💊', '💉', '🧪', '⚗️', '💎', '🌿', '❄️']

const SYMBOL_NAMES: Record<string, string> = {
  '💊': 'MATRA',
  '💉': 'DROG',
  '🧪': 'PERVITIN',
  '⚗️': 'CHEMIE',
  '💎': 'KRYSTAL',
  '🌿': 'TRÁVA',
  '❄️': 'SNÍH',
}

const SYMBOL_VALUES: Record<string, number> = {
  '💊': 2,
  '💉': 5,
  '🧪': 10,
  '⚗️': 3,
  '💎': 15,
  '🌿': 1,
  '❄️': 8,
}

type Grid = string[][]

function SlotMachine3D({ 
  grid, 
  spinning, 
  winningCells 
}: { 
  grid: Grid
  spinning: boolean
  winningCells: Set<string>
}) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 20]} fov={50} />
      <OrbitControls 
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2}
        autoRotate={!spinning}
        autoRotateSpeed={0.5}
      />
      
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#ff00ff" />
      
      <Environment preset="night" />
      
      {/* 9x9 Grid of 3D Reels */}
      {grid.map((row, rowIndex) => (
        row.map((symbol, colIndex) => {
          const cellKey = `${rowIndex}-${colIndex}`
          const isWinning = winningCells.has(cellKey)
          
          return (
            <group 
              key={cellKey}
              position={[
                (colIndex - 4) * 1.2,
                (4 - rowIndex) * 1.2,
                0
              ]}
            >
              <SlotReel3D
                symbol={symbol}
                spinning={spinning}
                index={rowIndex * 9 + colIndex}
                isWinning={isWinning}
                columnDelay={colIndex}
              />
            </group>
          )
        })
      ))}
      
      {/* Glowing base platform */}
      <mesh position={[0, -5.5, -2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial 
          color="#0a0a0a" 
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    </>
  )
}

export default function MatromatPage() {
  const [user, setUser] = useState<User | null>(null)
  const [smaze, setSmaze] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [bet, setBet] = useState(10)
  const [grid, setGrid] = useState<Grid>(
    Array(9).fill(null).map(() => 
      Array(9).fill(null).map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
    )
  )
  const [spinning, setSpinning] = useState(false)
  const [lastWin, setLastWin] = useState(0)
  const [winningCells, setWinningCells] = useState<Set<string>>(new Set())
  const [jackpot, setJackpot] = useState(false)
  const [totalWinnings, setTotalWinnings] = useState(0)
  const supabase = createClient()
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const loadData = async () => {
      console.log('[v0] Loading matromat data...')
      const { data: { user } } = await supabase.auth.getUser()
      console.log('[v0] User:', user?.id)
      setUser(user)
      
      if (user) {
        const { balance, error } = await getSmazeBalance()
        console.log('[v0] Initial SMAŽE balance:', balance, 'Error:', error)
        setSmaze(balance)
      }
      
      setLoading(false)
    }
    
    loadData()
  }, [supabase.auth])

  const spin = async () => {
    if (smaze < bet || spinning) return

    console.log('[v0] Starting spin, current balance:', smaze, 'bet:', bet)
    setSpinning(true)
    setLastWin(0)
    setWinningCells(new Set())
    setJackpot(false)
    audioManager.playSound('dice')

    // Deduct bet from database
    const { balance: newBalance, error } = await updateSmaze(-bet)
    if (error) {
      console.error('[v0] Failed to deduct bet:', error)
      setSpinning(false)
      return
    }
    console.log('[v0] Balance after bet deduction:', newBalance)
    setSmaze(newBalance)

    // Animate columns
    let columnIndex = 0
    const animateColumn = () => {
      if (columnIndex < 9) {
        setGrid(prev => {
          const newGrid = prev.map(row => [...row])
          for (let row = 0; row < 9; row++) {
            newGrid[row][columnIndex] = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
          }
          return newGrid
        })
        columnIndex++
        animationRef.current = window.setTimeout(animateColumn, 150)
      } else {
        setSpinning(false)
        calculateWin()
      }
    }

    animateColumn()
  }

  const calculateWin = async () => {
    let totalWin = 0
    const winCells = new Set<string>()
    let hasJackpot = false

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
    lines.push(Array(9).fill(null).map((_, i) => [i, i]))
    lines.push(Array(9).fill(null).map((_, i) => [i, 8 - i]))

    // Check each line
    lines.forEach(line => {
      const symbols = line.map(([r, c]) => grid[r][c])
      const counts: Record<string, number> = {}
      symbols.forEach(symbol => {
        counts[symbol] = (counts[symbol] || 0) + 1
      })

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

          line.forEach(([r, c]) => {
            if (grid[r][c] === symbol) {
              winCells.add(`${r}-${c}`)
            }
          })
        }
      })
    })

    if (totalWin > 0) {
      console.log('[v0] Win detected! Total win:', totalWin, 'Jackpot:', hasJackpot)
      setLastWin(totalWin)
      setWinningCells(winCells)
      setTotalWinnings(prev => prev + totalWin)
      setJackpot(hasJackpot)
      audioManager.playSound(hasJackpot ? 'win' : 'coin')

      // Add winnings to database
      const { balance: newBalance } = await updateSmaze(totalWin)
      console.log('[v0] Balance after win credit:', newBalance)
      setSmaze(newBalance)

      // Save score
      if (user) {
        await supabase.from('game_scores').insert({
          user_id: user.id,
          game_id: 'matromat',
          score: totalWin,
        })
      }
    } else {
      audioManager.playSound('lose')
    }
  }

  const adjustBet = (amount: number) => {
    const newBet = bet + amount
    setBet(Math.max(10, Math.min(100, newBet)))
    audioManager.playSound('click')
  }

  const handleReset = async () => {
    const { balance } = await resetSmaze()
    setSmaze(balance)
    setBet(10)
    setGrid(Array(9).fill(null).map(() => Array(9).fill('💊')))
    setLastWin(0)
    setWinningCells(new Set())
    setJackpot(false)
    setTotalWinnings(0)
    audioManager.playSound('click')
  }

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current)
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-to-b from-[#00ff00]/5 via-background to-background -z-10" />

      <header className="p-4 border-b border-border/50 backdrop-blur-sm bg-background/80">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Zpět
          </Link>
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-[#00ff00]" style={{ filter: 'drop-shadow(0 0 5px #00ff00)' }} />
            <span className="font-bold text-xl text-[#00ff00]" style={{ textShadow: '0 0 5px #00ff00' }}>
              {smaze.toLocaleString()} SMAŽE
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-foreground mb-2">Matromat 3D</h1>
          <p className="text-muted-foreground">Herní automat s 81 liniemi</p>
        </div>

        <div className="grid lg:grid-cols-[1fr,400px] gap-6">
          {/* 3D Canvas */}
          <Card className="border-[#00ff00]/30 bg-gradient-to-b from-card/80 to-card/50 backdrop-blur-sm overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-[#00ff00] via-[#ff00ff] to-[#0088ff]" />
            
            <CardContent className="p-0">
              <div className="w-full h-[600px] bg-black relative">
                <Canvas shadows gl={{ antialias: true, alpha: false }}>
                  <Suspense fallback={null}>
                    <SlotMachine3D 
                      grid={grid} 
                      spinning={spinning} 
                      winningCells={winningCells} 
                    />
                  </Suspense>
                </Canvas>
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <div className="space-y-4">
            {jackpot && (
              <Card className="border-[#00ff00]/50 bg-[#00ff00]/10">
                <CardContent className="p-4 text-center">
                  <Sparkles className="h-10 w-10 text-[#00ff00] mx-auto mb-2 animate-pulse" />
                  <p className="text-2xl font-bold text-[#00ff00]" style={{ textShadow: '0 0 10px #00ff00' }}>
                    JACKPOT!
                  </p>
                </CardContent>
              </Card>
            )}

            {lastWin > 0 && !spinning && (
              <Card className="border-[#00ff00]/30 bg-card/50">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Výhra!</p>
                  <p className="text-3xl font-bold text-[#00ff00]" style={{ textShadow: '0 0 10px #00ff00' }}>
                    +{lastWin.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {winningCells.size} vyhrávajících symbolů
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Bet Controls */}
            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => adjustBet(-10)}
                    disabled={bet <= 10 || spinning}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Sázka</p>
                    <p className="text-2xl font-bold">{bet} SMAŽE</p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => adjustBet(10)}
                    disabled={bet >= 100 || spinning}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  onClick={spin}
                  disabled={smaze < bet || spinning}
                  className="w-full h-14 text-xl font-bold bg-gradient-to-r from-[#00ff00] to-[#ff00ff] hover:from-[#00ff00]/90 hover:to-[#ff00ff]/90 text-black"
                  style={{ boxShadow: '0 0 20px #00ff00, 0 0 40px #ff00ff' }}
                >
                  {spinning ? 'Točí se...' : smaze < bet ? 'Nedostatek SMAŽE' : 'ZATOČIT!'}
                </Button>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Celkové výhry</span>
                    <span className="text-lg font-bold text-[#00ff00]">
                      +{totalWinnings.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Současný zůstatek</span>
                    <span className="text-lg font-bold text-[#ff00ff]">
                      {smaze.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Symbol Values */}
            <Card className="border-border/50 bg-card/30">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3">Hodnoty symbolů</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(SYMBOL_NAMES).map(([symbol, name]) => (
                    <div key={symbol} className="flex items-center justify-between p-2 bg-secondary/30 rounded">
                      <span className="text-lg">{symbol}</span>
                      <Badge variant="outline" className="text-xs">
                        {SYMBOL_VALUES[symbol]}x
                      </Badge>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  3+ stejné = výhra • 9 stejných = JACKPOT!
                </p>
              </CardContent>
            </Card>

            {/* Reset */}
            {smaze < bet && (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold mb-3">Nedostatek SMAŽE!</p>
                  <Button onClick={handleReset} className="w-full gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Reset (2000 SMAŽE)
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
