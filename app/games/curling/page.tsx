'use client'

import { useState, useEffect, useRef } from 'react'
import { audioManager } from '@/lib/audio-manager'
import { Button } from '@/components/ui/button'

export default function CurlingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stones, setStones] = useState<Array<{ x: number; y: number; vx: number; vy: number }>>([])
  const [score, setScore] = useState(0)
  const [power, setPower] = useState(0)
  const [angle, setAngle] = useState(0)
  const canvasWidth = 800
  const canvasHeight = 400

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#1a3a4a'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // Draw target circles
    ctx.strokeStyle = '#ff0000'
    ctx.lineWidth = 2
    for (let r = 30; r <= 60; r += 15) {
      ctx.beginPath()
      ctx.arc(canvasWidth - 50, canvasHeight / 2, r, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Draw stones
    stones.forEach(stone => {
      ctx.fillStyle = '#ffaa00'
      ctx.beginPath()
      ctx.arc(stone.x, stone.y, 10, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowColor = '#ffaa00'
      ctx.shadowBlur = 15
      ctx.strokeStyle = '#ff6600'
      ctx.lineWidth = 2
      ctx.stroke()
    })

    // Update physics
    setStones(prevStones =>
      prevStones
        .map(s => ({
          ...s,
          x: s.x + s.vx,
          y: s.y + s.vy,
          vx: s.vx * 0.98,
          vy: s.vy * 0.98,
        }))
        .filter(s => {
          const targetDist = Math.sqrt(
            Math.pow(s.x - (canvasWidth - 50), 2) + Math.pow(s.y - canvasHeight / 2, 2)
          )
          if (targetDist < 30) {
            setScore(prev => prev + 100)
            audioManager.playSound('win')
          }
          return s.x > 0 && s.x < canvasWidth && s.y > 0 && s.y < canvasHeight && (Math.abs(s.vx) > 0.5 || Math.abs(s.vy) > 0.5)
        })
    )
  }, [stones, canvasWidth, canvasHeight])

  const throwStone = () => {
    if (power === 0) return
    const rad = (angle * Math.PI) / 180
    const newStone = {
      x: 50,
      y: canvasHeight / 2,
      vx: Math.cos(rad) * power * 0.1,
      vy: Math.sin(rad) * power * 0.1,
    }
    setStones(prev => [...prev, newStone])
    setPower(0)
    audioManager.playSound('dice')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-20 px-4">
      <h1 className="text-4xl font-bold text-[#00ffff]" style={{ textShadow: '0 0 20px #00ffff' }} className="mb-8">
        CURLING PRO SMAŽKY
      </h1>
      <p className="text-[#00ff00] text-2xl mb-8">Skóre: {score}</p>

      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="border-4 border-[#00ffff] mb-8"
        style={{ boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)' }}
      />

      <div className="flex flex-col gap-4 items-center">
        <div className="flex gap-4">
          <label className="text-[#ff00ff]">
            Úhel: {angle}°
            <input
              type="range"
              min="-45"
              max="45"
              value={angle}
              onChange={e => setAngle(Number(e.target.value))}
              className="w-32 ml-2"
            />
          </label>
        </div>
        <div className="flex gap-4">
          <label className="text-[#ff00ff]">
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
        <Button onClick={throwStone} className="bg-[#ff6600] hover:bg-[#ff4400] text-black font-bold">
          HODIT KÁMEN!
        </Button>
      </div>
    </div>
  )
}
