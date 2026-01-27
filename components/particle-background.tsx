"use client"

import { useEffect, useRef } from "react"

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let particles: Particle[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    class Particle {
      x: number
      y: number
      speed: number
      size: number
      opacity: number

      constructor() {
        this.init()
      }

      init() {
        this.x = Math.random() * canvas!.width
        this.y = Math.random() * canvas!.height
        this.speed = Math.random() * 0.4 + 0.1
        this.size = Math.random() * 1.5
        this.opacity = Math.random() * 0.5
      }

      draw() {
        if (!ctx) return
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
        this.y -= this.speed
        if (this.y < -10) this.y = canvas!.height + 10
      }
    }

    const init = () => {
      particles = []
      for (let i = 0; i < 120; i++) {
        particles.push(new Particle())
      }
    }

    const animate = () => {
      if (!ctx) return
      ctx.clearRect(0, 0, canvas!.width, canvas!.height)
      particles.forEach((p) => p.draw())
      requestAnimationFrame(animate)
    }

    window.addEventListener("resize", resize)
    resize()
    init()
    animate()

    return () => {
      window.removeEventListener("resize", resize)
    }
  }, [])

  return <canvas ref={canvasRef} id="bg-canvas" />
}
