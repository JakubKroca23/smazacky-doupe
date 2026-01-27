'use client'

import { useState, useEffect, useRef } from 'react'
import { audioManager } from '@/lib/audio-manager'
import { Button } from '@/components/ui/button'

export default function BowlingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ball, setBall] = useState({ x: 100, y: 200, vx: 0, vy: 0, rolling: false })
  const [pins, setPins] = useState<Array<{ x: number; y: number; knocked: boolean }>>([])
  const [score, setScore] = useState(0)
  const [power, setPower] = useState(0)
  const canvasWidth = 800
  const canvasHeight = 400

  // Initialize pins
  useEffect(() => {
    if (pins.length === 0) {
      const newPins = []
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col <= row; col++) {
          newPins.push({
            x: canvasWidth - 100 + row * 25 - col * 12.5,
            y: canvasHeight / 2 - row * 20 + col * 20,
            knocked: false,
          })
        }
      }
      setPins(newPins)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#0a1a0a'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // Draw lane
    ctx.strokeStyle = '#333333'
    ctx.lineWidth = 3
    ctx.strokeRect(50, 50, canvasWidth - 100, canvasHeight - 100)

    // Draw ball
    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, 15, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#ff0000'
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw pins
    pins.forEach(pin => {
      ctx.fillStyle = pin.knocked ? '#666666' : '#ffffff'
      ctx.beginPath()
      ctx.arc(pin.x, pin.y, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#ffff00'
      ctx.lineWidth = 1
      ctx.stroke()
    })

    // Update physics
    if (ball.rolling) {
      setBall(prev => {
        let newBall = { ...prev }
        newBall.x += newBall.vx
        newBall.y += newBall.vy
        newBall.vx *= 0.98
        newBall.vy *= 0.98

        // Check collisions with pins
        let hitCount = 0
        setPins(prevPins =>
          prevPins.map(pin => {
            const dist = Math.sqrt(
              Math.pow(newBall.x - pin.x, 2) + Math.pow(newBall.y - pin.y, 2)
            )
            if (dist < 25 && !pin.knocked) {
              hitCount++
              audioManager.playSound('win')
              return { ...pin, knocked: true }
            }
            return pin
          })
        )

        if (hitCount > 0) {
          setScore(prev => prev + hitCount * 10)
        }

        // Stop ball
        if (
          Math.abs(newBall.vx) < 0.5 &&
          Math.abs(newBall.vy) < 0.5
        ) {
          newBall.rolling = false
          newBall.vx = 0
          newBall.vy = 0
        }

        return newBall
      })
    }
  }, [ball, pins])

  const throwBall = () => {
    if (power === 0) return
    setBall({
      x: 100,
      y: 200,
      vx: power * 0.3,
      vy: 0,
      rolling: true,
    })
    setPower(0)
    audioManager.playSound('dice')
  }

  const resetGame = () => {
    setBall({ x: 100, y: 200, vx: 0, vy: 0, rolling: false })
    setPins(pins.map(p => ({ ...p, knocked: false })))
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-20 px-4">
      <h1 className="text-4xl font-bold text-[#ff00ff]" style={{ textShadow: '0 0 20px #ff00ff' }} className="mb-8">
        SMAŽÁCKÝ BOWLING
      </h1>
      <p className="text-[#00ff00] text-2xl mb-8">Skóre: {score}</p>

      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="border-4 border-[#ff00ff] mb-8"
        style={{ boxShadow: '0 0 30px rgba(255, 0, 255, 0.5)' }}
      />

      <div className="flex flex-col gap-4 items-center">
        <div className="flex gap-4">
          <label className="text-[#00ffff]">
            Síla: {power}
            <input
              type="range"
              min="0"
              max="100"
              value={power}
              onChange={e => setPower(Number(e.target.value))}
              className="w-32 ml-2"
            />
          </label>
        </div>
        <div className="flex gap-4">
          <Button onClick={throwBall} className="bg-[#ff0000] hover:bg-[#dd0000] text-white font-bold">
            HODIT MÍČI!
          </Button>
          <Button onClick={resetGame} className="bg-[#0088ff] hover:bg-[#0066dd] text-white font-bold">
            RESET
          </Button>
        </div>
      </div>
    </div>
  )
}
