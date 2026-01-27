'use client'

import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

interface SlotReel3DProps {
  symbol: string
  spinning: boolean
  index: number
  isWinning: boolean
  columnDelay: number
}

export function SlotReel3D({ symbol, spinning, index, isWinning, columnDelay }: SlotReel3DProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const targetRotation = useRef(0)
  const currentRotation = useRef(0)
  const spinSpeed = useRef(0)
  const startTime = useRef(0)
  const hasStarted = useRef(false)

  useEffect(() => {
    if (spinning && !hasStarted.current) {
      hasStarted.current = true
      startTime.current = Date.now()
      spinSpeed.current = 0.5
      targetRotation.current = currentRotation.current + Math.PI * 2 * (8 + Math.random() * 4)
    } else if (!spinning) {
      hasStarted.current = false
      spinSpeed.current = 0
    }
  }, [spinning])

  useFrame((state, delta) => {
    if (!meshRef.current) return

    if (spinning) {
      const elapsed = Date.now() - startTime.current
      const delay = columnDelay * 100
      
      if (elapsed > delay) {
        // Spin with easing
        const progress = Math.min((elapsed - delay) / 1000, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        
        currentRotation.current += spinSpeed.current * delta * 10 * (1 - eased * 0.95)
        meshRef.current.rotation.x = currentRotation.current
      }
    }

    // Winning glow animation
    if (isWinning) {
      const pulse = Math.sin(state.clock.elapsedTime * 4) * 0.5 + 0.5
      meshRef.current.scale.setScalar(1 + pulse * 0.15)
    } else {
      meshRef.current.scale.setScalar(1)
    }
  })

  return (
    <group>
      <mesh ref={meshRef} castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.8, 32]} />
        <meshStandardMaterial 
          color={isWinning ? '#00ff00' : '#1a1a2e'}
          metalness={0.6}
          roughness={0.3}
          emissive={isWinning ? '#00ff00' : '#000000'}
          emissiveIntensity={isWinning ? 0.5 : 0}
        />
      </mesh>
      <Text
        position={[0, 0, 0.41]}
        fontSize={0.5}
        color={isWinning ? '#00ff00' : '#ffffff'}
        anchorX="center"
        anchorY="middle"
        font="/fonts/Geist-Bold.ttf"
      >
        {symbol}
      </Text>
      {isWinning && (
        <pointLight 
          color="#00ff00" 
          intensity={2} 
          distance={3}
          castShadow
        />
      )}
    </group>
  )
}
