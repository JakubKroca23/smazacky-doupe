'use client'

import { useState, useEffect, useRef } from 'react'
import { audioManager } from '@/lib/audio-manager'
import { Button } from '@/components/ui/button'

const GRID_WIDTH = 10
const GRID_HEIGHT = 20
const CELL_SIZE = 30

const TETRIS_PIECES = [
  { shape: [[1,1,1,1]], color: '#00ffff' }, // I
  { shape: [[1,1],[1,1]], color: '#ffff00' }, // O
  { shape: [[0,1,1],[1,1,0]], color: '#00ff00' }, // S
  { shape: [[1,1,0],[0,1,1]], color: '#ff0000' }, // Z
  { shape: [[1,0,0],[1,1,1]], color: '#0000ff' }, // J
  { shape: [[0,0,1],[1,1,1]], color: '#ff7700' }, // L
  { shape: [[0,1,0],[1,1,1]], color: '#ff00ff' }, // T
]

export default function TetrisPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [grid, setGrid] = useState<number[][]>(Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(0)))
  const [currentPiece, setCurrentPiece] = useState(TETRIS_PIECES[0])
  const [position, setPosition] = useState({ x: 3, y: 0 })
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const gameLoopRef = useRef<NodeJS.Timeout>()

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 1
    for (let i = 0; i <= GRID_WIDTH; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL_SIZE, 0)
      ctx.lineTo(i * CELL_SIZE, GRID_HEIGHT * CELL_SIZE)
      ctx.stroke()
    }
    for (let i = 0; i <= GRID_HEIGHT; i++) {
      ctx.beginPath()
      ctx.moveTo(0, i * CELL_SIZE)
      ctx.lineTo(GRID_WIDTH * CELL_SIZE, i * CELL_SIZE)
      ctx.stroke()
    }

    // Draw placed blocks
    grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          ctx.fillStyle = '#00ff00'
          ctx.fillRect(x * CELL_SIZE + 2, y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4)
          ctx.shadowColor = '#00ff00'
          ctx.shadowBlur = 10
        }
      })
    })

    // Draw current piece
    currentPiece.shape.forEach((row, dy) => {
      row.forEach((cell, dx) => {
        if (cell) {
          const x = (position.x + dx) * CELL_SIZE + 2
          const y = (position.y + dy) * CELL_SIZE + 2
          ctx.fillStyle = currentPiece.color
          ctx.fillRect(x, y, CELL_SIZE - 4, CELL_SIZE - 4)
          ctx.shadowColor = currentPiece.color
          ctx.shadowBlur = 15
        }
      })
    })
  }, [grid, currentPiece, position])

  // Game loop
  useEffect(() => {
    if (gameOver) return

    gameLoopRef.current = setInterval(() => {
      setPosition(prev => {
        const newY = prev.y + 1
        // Check collision
        let collision = false
        currentPiece.shape.forEach((row, dy) => {
          row.forEach((cell, dx) => {
            if (cell) {
              const gridY = newY + dy
              if (gridY >= GRID_HEIGHT || grid[gridY]?.[prev.x + dx]) {
                collision = true
              }
            }
          })
        })

        if (collision) {
          // Place piece
          const newGrid = grid.map(r => [...r])
          currentPiece.shape.forEach((row, dy) => {
            row.forEach((cell, dx) => {
              if (cell) {
                newGrid[prev.y + dy][prev.x + dx] = 1
              }
            })
          })
          setGrid(newGrid)
          setCurrentPiece(TETRIS_PIECES[Math.floor(Math.random() * TETRIS_PIECES.length)])
          setPosition({ x: 3, y: 0 })
          
          // Check for complete lines
          const completedLines = newGrid.filter(row => row.every(cell => cell === 1)).length
          if (completedLines > 0) {
            setScore(prev => prev + completedLines * 100)
            audioManager.playSound('win')
          }
          return prev
        }

        return { ...prev, y: newY }
      })
    }, 500)

    return () => clearInterval(gameLoopRef.current)
  }, [grid, currentPiece, gameOver])

  const moveLeft = () => {
    if (position.x > 0) setPosition(prev => ({ ...prev, x: prev.x - 1 }))
    audioManager.playSound('click')
  }

  const moveRight = () => {
    if (position.x < GRID_WIDTH - 2) setPosition(prev => ({ ...prev, x: prev.x + 1 }))
    audioManager.playSound('click')
  }

  const moveDown = () => {
    setPosition(prev => ({ ...prev, y: prev.y + 1 }))
    audioManager.playSound('click')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-20 px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#ff00ff]" style={{ textShadow: '0 0 20px #ff00ff' }}>
          SMAŽÁCKÝ TETRIS
        </h1>
        <p className="text-[#00ff00] text-2xl mt-4">Skóre: {score}</p>
      </div>

      <canvas
        ref={canvasRef}
        width={GRID_WIDTH * CELL_SIZE}
        height={GRID_HEIGHT * CELL_SIZE}
        className="border-4 border-[#00ff00] mb-8"
        style={{ boxShadow: '0 0 30px rgba(0, 255, 0, 0.5)' }}
      />

      <div className="flex gap-4">
        <Button onClick={moveLeft} className="bg-[#0088ff] hover:bg-[#0066dd]">
          ← Vlevo
        </Button>
        <Button onClick={moveDown} className="bg-[#00ff00] hover:bg-[#00dd00]">
          ↓ Dolů
        </Button>
        <Button onClick={moveRight} className="bg-[#0088ff] hover:bg-[#0066dd]">
          Vpravo →
        </Button>
      </div>
    </div>
  )
}
