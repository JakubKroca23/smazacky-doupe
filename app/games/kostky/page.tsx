"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

const WIN_SCORE = 10000

interface Player {
  id: string
  name: string
  score: number
  strikes: number
  gramy: number
  smazanoCount: number
}

interface GameState {
  turn: string
  lastDice: number[]
  storedDice: number[]
  rollCount: number
  isAnimating: boolean
  turnBasePoints: number
  sixCount: number
  mirrorActive: boolean
  hasTakenThisRoll: boolean
}

interface ChatMessage {
  sender: string
  text: string
  time: number
}

interface RoomData {
  status: 'lobby' | 'playing' | 'stats'
  state: GameState
  players: Record<string, Player>
  visuals: { tripTimestamp: number; emojiSync: number }
  chat: Record<string, ChatMessage>
}

export default function KostkyPage() {
  const [myData, setMyData] = useState({ name: '', room: '', id: '', isHost: false })
  const [screen, setScreen] = useState<'setup' | 'lobby' | 'game' | 'stats'>('setup')
  const [roomData, setRoomData] = useState<RoomData | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [gameId, setGameId] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [isRushActive, setIsRushActive] = useState(false)
  const [lastTripTimestamp, setLastTripTimestamp] = useState(0)
  const [lastEmojiSync, setLastEmojiSync] = useState(0)
  const [dicePhysics, setDicePhysics] = useState<{x: number, y: number, vx: number, vy: number, r: number, vr: number}[]>([])
  const [msgBox, setMsgBox] = useState('')
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [inviteLink, setInviteLink] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const animFrameRef = useRef<number | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  
  const supabase = createClient()

  // Check auth and URL params on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        setUser({ id: authUser.id, email: authUser.email || '' })
        setPlayerName(authUser.email?.split('@')[0] || 'Hrac')
      }
      setIsLoading(false)
    }
    checkAuth()

    // Check URL for room parameter
    const urlParams = new URLSearchParams(window.location.search)
    const roomParam = urlParams.get('room')
    if (roomParam) {
      setGameId(roomParam)
    }
  }, [supabase.auth])

  // Generate room code
  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  // Copy invite link
  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setLinkCopied(true)
    showMsg("Odkaz zkopirovan!")
    setTimeout(() => setLinkCopied(false), 2000)
  }

  // Show message box
  const showMsg = (t: string) => {
    setMsgBox(t)
    setTimeout(() => setMsgBox(''), 2500)
  }

  // Emoji shower effect
  const triggerEmojiShower = useCallback(() => {
    const emojis = ['💊', '💎', '🌿', '⚡', '💉', '😵‍💫', '🍄']
    for(let i = 0; i < 30; i++) {
      setTimeout(() => {
        const el = document.createElement('div')
        el.className = 'emoji-shower'
        el.innerText = emojis[Math.floor(Math.random() * emojis.length)]
        el.style.left = Math.random() * 100 + 'vw'
        el.style.setProperty('--drift', (Math.random() - 0.5) * 300 + 'px')
        document.body.appendChild(el)
        setTimeout(() => el.remove(), 2000)
      }, i * 50)
    }
  }, [])

  // Create crystals effect
  const createCrystals = useCallback((x: number, y: number) => {
    for(let i = 0; i < 15; i++) {
      const cry = document.createElement('div')
      cry.className = 'crystal'
      cry.innerText = '💎'
      cry.style.left = x + 'px'
      cry.style.top = y + 'px'
      cry.style.setProperty('--cx', (Math.random() - 0.5) * 400 + 'px')
      cry.style.setProperty('--cy', (Math.random() - 0.5) * 400 + 'px')
      cry.style.setProperty('--cr', (Math.random() * 720) + 'deg')
      document.body.appendChild(cry)
      setTimeout(() => cry.remove(), 1500)
    }
  }, [])

  // LSD trip effect
  const triggerLsdTrip = useCallback(() => {
    document.body.classList.add('lsd-trip')
    setTimeout(() => document.body.classList.remove('lsd-trip'), 4000)
  }, [])

  // Parno rush (snow) effect
  const startParnoRush = useCallback(() => {
    if(isRushActive) return
    setIsRushActive(true)
    document.body.classList.add('rush-mode')
    const snow = document.getElementById('snow-container')
    if(snow) {
      snow.style.display = 'block'
      snow.innerHTML = ''
      for(let i = 0; i < 80; i++) {
        const f = document.createElement('div')
        f.className = 'flake'
        f.style.left = Math.random() * 100 + 'vw'
        f.style.width = f.style.height = (Math.random() * 4 + 2) + 'px'
        f.style.animationDuration = (Math.random() * 1.5 + 0.5) + 's'
        snow.appendChild(f)
      }
    }
    setTimeout(() => {
      setIsRushActive(false)
      document.body.classList.remove('rush-mode')
      if(snow) snow.style.display = 'none'
    }, 30000)
  }, [isRushActive])

  // Floating baggies effect
  useEffect(() => {
    if (screen !== 'setup' && screen !== 'lobby') return
    
    const interval = setInterval(() => {
      const container = document.getElementById('baggie-container-bg')
      if (!container) return
      
      const bag = document.createElement('div')
      bag.className = 'floating-baggie'
      bag.innerHTML = `<svg width="60" height="70" viewBox="0 0 60 70" fill="none" xmlns="http://www.w3.org/2000/svg" style="pointer-events: none;"><rect x="5" y="10" width="50" height="55" rx="3" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="2"/><path d="M5 18H55" stroke="white" strokeWidth="2"/><rect x="15" y="25" width="30" height="30" fill="white" fillOpacity="0.7"/><text x="30" y="5" fill="red" fontSize="6" fontWeight="bold" textAnchor="middle">POZOR!</text><text x="30" y="45" fill="black" fontSize="4" fontWeight="bold" textAnchor="middle">RYCHLOST</text></svg>`
      bag.style.left = Math.random() * (window.innerWidth - 60) + 'px'
      bag.style.top = Math.random() * (window.innerHeight - 70) + 'px'
      bag.style.width = (40 + Math.random() * 30) + 'px'
      bag.style.setProperty('--tx', (Math.random() - 0.5) * 800 + 'px')
      bag.style.setProperty('--ty', (Math.random() - 0.5) * 800 + 'px')
      bag.style.animationDuration = (8 + Math.random() * 10) + 's'
      
      bag.onclick = async (e) => {
        e.stopPropagation()
        createCrystals(e.clientX, e.clientY)
        if (myData.room) {
          await supabase.rpc('increment_gramy', { room_id: myData.room, player_id: myData.id })
          showMsg("+1g matra!")
        }
        bag.style.transform = 'scale(0)'
        bag.style.opacity = '0'
        setTimeout(() => bag.remove(), 200)
      }
      
      container.appendChild(bag)
      setTimeout(() => { if(bag.parentElement) bag.remove() }, 18000)
    }, 1200)
    
    return () => clearInterval(interval)
  }, [screen, myData.room, myData.id, createCrystals, supabase])

  // Subscribe to room updates
  useEffect(() => {
    if (!myData.room) return

    const channel = supabase
      .channel(`kostky-room-${myData.room}`)
      .on('broadcast', { event: 'room-update' }, ({ payload }) => {
        setRoomData(payload as RoomData)
      })
      .subscribe()

    channelRef.current = channel

    // Fetch initial room data
    fetchRoomData()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [myData.room, supabase])

  // Sync UI based on room data
  useEffect(() => {
    if (!roomData) return

    // Handle visual effects
    if (roomData.visuals?.tripTimestamp > lastTripTimestamp) {
      triggerLsdTrip()
      setLastTripTimestamp(roomData.visuals.tripTimestamp)
    }
    if (roomData.visuals?.emojiSync > lastEmojiSync) {
      triggerEmojiShower()
      setLastEmojiSync(roomData.visuals.emojiSync)
    }

    // Handle screen changes
    if (roomData.status === 'playing') {
      setScreen('game')
    } else if (roomData.status === 'stats') {
      setScreen('stats')
    } else if (roomData.status === 'lobby') {
      setScreen('lobby')
    }
  }, [roomData, lastTripTimestamp, lastEmojiSync, triggerLsdTrip, triggerEmojiShower])

  const fetchRoomData = async () => {
    const { data } = await supabase
      .from('kostky_rooms')
      .select('*')
      .eq('id', myData.room)
      .single()
    
    if (data) {
      setRoomData(data.room_data as RoomData)
    }
  }

  const broadcastUpdate = async (newData: RoomData) => {
    // Update local state immediately
    setRoomData(newData)
    
    await supabase
      .from('kostky_rooms')
      .update({ room_data: newData })
      .eq('id', myData.room)

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'room-update',
        payload: newData
      })
    }
  }

  const connect = async (type: 'create' | 'join') => {
    if (!user) {
      showMsg("Musis byt prihlasen!")
      return
    }
    if (!playerName.trim()) {
      showMsg("Zadej prezdivku!")
      return
    }
    
    const roomCode = type === 'create' ? generateRoomCode() : gameId.toUpperCase()
    if (!roomCode.trim()) {
      showMsg("Zadej kod mistnosti!")
      return
    }
    
    const newMyData = {
      name: playerName,
      room: roomCode,
      id: user.id,
      isHost: type === 'create'
    }
    setMyData(newMyData)

    if (type === 'create') {
      const initialState: RoomData = {
        status: 'lobby',
        state: {
          turn: newMyData.id,
          lastDice: [1, 2, 3, 4, 5, 6],
          storedDice: [],
          rollCount: 0,
          isAnimating: false,
          turnBasePoints: 0,
          sixCount: 0,
          mirrorActive: false,
          hasTakenThisRoll: true
        },
        players: {
          [newMyData.id]: { id: newMyData.id, name: playerName, score: 0, strikes: 0, gramy: 0, smazanoCount: 0 }
        },
        visuals: { tripTimestamp: 0, emojiSync: 0 },
        chat: {}
      }

      await supabase
        .from('kostky_rooms')
        .upsert({ id: roomCode, room_data: initialState, host_id: newMyData.id })
      
      setRoomData(initialState)
      
      // Generate invite link
      const link = `${window.location.origin}${window.location.pathname}?room=${roomCode}`
      setInviteLink(link)
    } else {
      const { data, error } = await supabase
        .from('kostky_rooms')
        .select('room_data')
        .eq('id', roomCode)
        .single()

      if (error || !data) {
        showMsg("Mistnost neexistuje!")
        return
      }

      const currentData = data.room_data as RoomData
      if (currentData.status !== 'lobby') {
        showMsg("Hra jiz zacala!")
        return
      }
      
      currentData.players[newMyData.id] = { id: newMyData.id, name: playerName, score: 0, strikes: 0, gramy: 0, smazanoCount: 0 }
      
      await supabase
        .from('kostky_rooms')
        .update({ room_data: currentData })
        .eq('id', roomCode)
      
      setRoomData(currentData)
      
      // Set invite link for joined player too
      const link = `${window.location.origin}${window.location.pathname}?room=${roomCode}`
      setInviteLink(link)
    }
    
    setScreen('lobby')
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !roomData) return
    
    const msgId = Date.now().toString()
    const newChat = { ...roomData.chat, [msgId]: { sender: myData.name, text: chatInput, time: Date.now() } }
    const newData = { ...roomData, chat: newChat }
    
    setChatInput('')
    await broadcastUpdate(newData)
  }

  const startGame = async () => {
    if (!roomData || !myData.isHost) return
    
    const newData = { ...roomData, status: 'playing' as const }
    await broadcastUpdate(newData)
  }

  const triggerEmojiSync = async () => {
    if (!roomData) return
    const newData = { ...roomData, visuals: { ...roomData.visuals, emojiSync: Date.now() } }
    await broadcastUpdate(newData)
  }

  // Physics animation for rolling dice
  const startPhysicsAnimation = useCallback((count: number) => {
    if (animFrameRef.current) return
    
    const table = document.getElementById('dice-table')
    if (!table) return
    
    const dieSize = 45
    const initialPhysics = Array.from({ length: count }, () => ({
      x: Math.random() * (table.clientWidth - dieSize),
      y: Math.random() * (table.clientHeight - dieSize),
      vx: (Math.random() - 0.5) * 40,
      vy: (Math.random() - 0.5) * 40,
      r: Math.random() * 360,
      vr: (Math.random() - 0.5) * 20
    }))
    setDicePhysics(initialPhysics)

    const loop = () => {
      setDicePhysics(prev => {
        const newPhysics = prev.map(p => {
          let newX = p.x + p.vx
          let newY = p.y + p.vy
          let newVx = p.vx
          let newVy = p.vy
          
          if (newX < 0 || newX > (table?.clientWidth || 300) - dieSize) newVx *= -0.8
          if (newY < 0 || newY > (table?.clientHeight || 200) - dieSize) newVy *= -0.8
          
          return { x: newX, y: newY, vx: newVx, vy: newVy, r: p.r + p.vr, vr: p.vr }
        })
        return newPhysics
      })
      animFrameRef.current = requestAnimationFrame(loop)
    }
    loop()
  }, [])

  const stopPhysicsAnimation = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
  }, [])

  // Check if dice have scoring
  const hasScoring = (dice: number[]) => {
    const counts: Record<number, number> = {}
    dice.forEach(v => counts[v] = (counts[v] || 0) + 1)
    return dice.includes(1) || dice.includes(5) || Object.values(counts).some(v => v >= 3) || (dice.length === 6 && new Set(dice).size === 6)
  }

  // Handle roll
  const handleRoll = async () => {
    if (!roomData) return
    const s = roomData.state
    
    // Can roll if: it's my turn, not animating, and either first roll (rollCount === 0) or took something after last roll
    if (s.turn !== myData.id || s.isAnimating) return
    if (s.rollCount > 0 && !s.hasTakenThisRoll) {
      showMsg("Musíš něco odebrat!")
      return
    }
    
    if (s.rollCount >= 3 && s.turnBasePoints < 350) {
      showMsg("🚭 ABSŤÁK! MÁLO BODŮ!")
      setTimeout(() => passTurn(0), 500)
      return
    }
    
    const countToRoll = s.lastDice.length > 0 ? s.lastDice.length : 6
    
    // Start animation
    const animatingData = { ...roomData, state: { ...s, isAnimating: true, hasTakenThisRoll: false } }
    await broadcastUpdate(animatingData)
    startPhysicsAnimation(countToRoll)
    
    setTimeout(async () => {
      stopPhysicsAnimation()
      const finalDice = Array.from({ length: countToRoll }, () => Math.floor(Math.random() * 6) + 1)
      let rolledSixes = finalDice.filter(x => x === 6).length
      let newSixCount = (s.sixCount || 0) + rolledSixes
      let mirrorActive = s.mirrorActive
      if (newSixCount >= 23) { mirrorActive = true; newSixCount = 0 }
      
      if (!hasScoring(finalDice)) {
        showMsg("💩 NULA!")
        const newData = { ...roomData, state: { ...s, lastDice: finalDice, isAnimating: false, sixCount: newSixCount, mirrorActive, hasTakenThisRoll: false } }
        await broadcastUpdate(newData)
        setTimeout(() => passTurn(0), 1500)
      } else {
        // After rolling, hasTakenThisRoll = false, player must take something before rolling again
        const newData = { ...roomData, state: { ...s, lastDice: finalDice, rollCount: s.rollCount + 1, isAnimating: false, sixCount: newSixCount, mirrorActive, hasTakenThisRoll: false } }
        await broadcastUpdate(newData)
      }
    }, 1000)
  }

  // Take a die
  const takeDie = async (idx: number, val: number) => {
    if (!roomData) return
    const state = roomData.state
    let dice = [...state.lastDice]
    let stored = [...state.storedDice]
    let addedPoints = 0
    
    const counts: Record<number, number> = {}
    dice.forEach(v => counts[v] = (counts[v] || 0) + 1)
    
    if (dice.length === 6 && new Set(dice).size === 6) {
      addedPoints = 1500
      stored.push(...dice)
      dice = []
    } else if (counts[val] >= 3) {
      const c = counts[val]
      addedPoints = (val === 1 ? 1000 : val * 100) * Math.pow(2, c - 3)
      dice = dice.filter(v => v !== val)
      stored.push(...Array(c).fill(val))
    } else {
      addedPoints = val === 1 ? 100 : 50
      stored.push(val)
      dice.splice(idx, 1)
    }
    
    if (isRushActive) addedPoints *= 2
    
    const newState = {
      ...state,
      lastDice: dice,
      storedDice: stored,
      turnBasePoints: state.turnBasePoints + addedPoints,
      hasTakenThisRoll: true
    }
    
    const newData = { ...roomData, state: newState }
    await broadcastUpdate(newData)
  }

  // Bank points
  const bankPoints = async () => {
    if (!roomData) return
    if (roomData.state.turnBasePoints < 350) {
      showMsg("🔞 MUSÍŠ MÍT ASPOŇ 350!")
      return
    }
    await passTurn(roomData.state.turnBasePoints)
  }

  // Pass turn
  const passTurn = async (pts: number) => {
    if (!roomData) return
    
    const playersArr = Object.keys(roomData.players)
    const nextTurn = playersArr[(playersArr.indexOf(myData.id) + 1) % playersArr.length]
    
    const player = roomData.players[myData.id]
    let score = player.score
    let strikes = player.strikes
    let smazanoCount = player.smazanoCount
    
    if (pts > 0) {
      score += pts
      strikes = 0
    } else {
      strikes++
      if (strikes >= 3) {
        score = 0
        strikes = 0
        smazanoCount++
        showMsg("💀 SMAZÁNO! 💀")
        const newData = { ...roomData, visuals: { ...roomData.visuals, tripTimestamp: Date.now() } }
        await broadcastUpdate(newData)
      }
    }
    
    const newPlayers = { ...roomData.players }
    newPlayers[myData.id] = { ...player, score, strikes, smazanoCount }
    
    if (score >= WIN_SCORE) {
      const newData = { ...roomData, players: newPlayers, status: 'stats' as const }
      await broadcastUpdate(newData)
    } else {
      const newState: GameState = {
        turn: nextTurn,
        lastDice: [1, 2, 3, 4, 5, 6],
        storedDice: [],
        rollCount: 0,
        isAnimating: false,
        turnBasePoints: 0,
        sixCount: roomData.state.sixCount,
        mirrorActive: roomData.state.mirrorActive,
        hasTakenThisRoll: true
      }
      const newData = { ...roomData, players: newPlayers, state: newState }
      await broadcastUpdate(newData)
    }
  }

  // Reset to lobby
  const resetToLobby = async () => {
    if (!myData.isHost || !roomData) return
    
    const newPlayers = { ...roomData.players }
    Object.keys(newPlayers).forEach(pid => {
      newPlayers[pid] = { ...newPlayers[pid], score: 0, strikes: 0, smazanoCount: 0 }
    })
    
    const newData: RoomData = {
      ...roomData,
      status: 'lobby',
      players: newPlayers,
      state: {
        turn: myData.id,
        lastDice: [1, 2, 3, 4, 5, 6],
        storedDice: [],
        rollCount: 0,
        isAnimating: false,
        turnBasePoints: 0,
        sixCount: 0,
        mirrorActive: false,
        hasTakenThisRoll: true
      }
    }
    await broadcastUpdate(newData)
  }

  // Render dice
  const renderDice = () => {
    if (!roomData) return null
    const { state } = roomData
    const isMyTurn = state.turn === myData.id
    
    const counts: Record<number, number> = {}
    state.lastDice.forEach(v => counts[v] = (counts[v] || 0) + 1)
    
    return state.lastDice.map((val, i) => {
      const canTake = (val === 1 || val === 5 || counts[val] >= 3 || (state.lastDice.length === 6 && new Set(state.lastDice).size === 6))
      const physics = dicePhysics[i] || { x: 20 + i * 50, y: 50, r: 0 }
      
      return (
        <div
          key={i}
          className={`die ${state.rollCount > 0 && canTake && isMyTurn ? 'can-take' : ''}`}
          style={{
            left: physics.x + 'px',
            top: physics.y + 'px',
            transform: `rotate(${physics.r || 0}deg)`
          }}
          onClick={() => { if (isMyTurn && state.rollCount > 0 && canTake) takeDie(i, val) }}
        >
          {state.isAnimating ? Math.floor(Math.random() * 6) + 1 : val}
        </div>
      )
    })
  }

  // Get players array
  const playersArray = roomData ? Object.values(roomData.players) : []
  const chatMessages = roomData?.chat ? Object.values(roomData.chat).sort((a, b) => a.time - b.time) : []

  return (
    <div className="kostky-game">
      {/* Message box */}
      {msgBox && <div id="msg-box">{msgBox}</div>}
      
      {/* Snow container */}
      <div id="snow-container" />
      
      {/* Floating baggies container */}
      <div id="baggie-container-bg" />
      
      {/* Mirror overlay */}
      {roomData?.state.mirrorActive && (
        <div id="mirror-overlay" style={{ display: 'flex' }}>
          <h2 style={{ color: 'white', marginBottom: '10px' }}>DVACÁTÁ TŘETÍ ŠESTKA! 🪞</h2>
          <p style={{ color: 'var(--neon-blue)', marginBottom: '20px' }}>LAJNA JE PŘIPRAVENÁ!</p>
          <div id="mirror-surface">
            {playersArray.map((p, i) => (
              <div
                key={p.id}
                className="line-to-sniff"
                style={{ width: '60%', left: '20%', top: (15 + i * 12) + '%', fontSize: '0.6rem', color: 'black', textAlign: 'center' }}
                onClick={() => {
                  if (p.id === myData.id) {
                    showMsg("SMRRRRRK! 👃⚡")
                    startParnoRush()
                    if (myData.isHost && roomData) {
                      setTimeout(async () => {
                        const newData = { ...roomData, state: { ...roomData.state, mirrorActive: false } }
                        await broadcastUpdate(newData)
                      }, 2000)
                    }
                  }
                }}
              >
                {p.id === myData.id ? "MOJE ČÁRA" : p.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SETUP SCREEN */}
      {screen === 'setup' && (
        <section className="screen active">
          <h1>KOSTKY PRO SMAŽKY</h1>
          
          {isLoading ? (
            <p style={{ color: 'var(--neon-blue)' }}>Nacitam...</p>
          ) : !user ? (
            <div className="stack">
              <p style={{ color: 'var(--neon-pink)', marginBottom: '20px' }}>Pro hrani musis byt prihlasen</p>
              <a href="/auth/login" style={{ textDecoration: 'none' }}>
                <button style={{ width: '100%' }}>PRIHLASIT SE</button>
              </a>
              <a href="/auth/sign-up" style={{ textDecoration: 'none' }}>
                <button style={{ width: '100%', borderColor: 'var(--neon-blue)', color: 'var(--neon-blue)' }}>REGISTRACE</button>
              </a>
            </div>
          ) : (
            <div className="stack">
              <p style={{ color: 'var(--neon-green)', marginBottom: '10px' }}>Prihlasen jako: {user.email}</p>
              <input
                type="text"
                placeholder="Prezdivka"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
              
              <button onClick={() => connect('create')} style={{ borderColor: 'var(--neon-green)', color: 'var(--neon-green)' }}>
                VYTVORIT MISTNOST
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--neon-pink)' }} />
                <span style={{ color: 'var(--neon-pink)', fontSize: '0.8rem' }}>NEBO</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--neon-pink)' }} />
              </div>
              
              <input
                type="text"
                placeholder="Kod mistnosti (napr. ABC123)"
                value={gameId}
                onChange={(e) => setGameId(e.target.value.toUpperCase())}
                style={{ textTransform: 'uppercase' }}
              />
              <button onClick={() => connect('join')} style={{ borderColor: 'var(--neon-blue)', color: 'var(--neon-blue)' }}>
                PRIPOJIT SE
              </button>
            </div>
          )}
        </section>
      )}

      {/* LOBBY SCREEN */}
      {screen === 'lobby' && (
        <section className="screen active">
          <h1>LOBBY</h1>
          
          {/* Room code and invite link */}
          <div style={{ background: 'rgba(0,255,255,0.1)', border: '2px solid var(--neon-blue)', borderRadius: '12px', padding: '15px', marginBottom: '15px' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--neon-pink)', marginBottom: '5px' }}>KOD MISTNOSTI:</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--neon-green)', letterSpacing: '5px', textShadow: '0 0 10px var(--neon-green)' }}>{myData.room}</p>
            
            {inviteLink && (
              <div style={{ marginTop: '10px' }}>
                <p style={{ fontSize: '0.7rem', color: '#888', marginBottom: '5px' }}>Posli odkaz kamaradum:</p>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    style={{ flex: 1, fontSize: '0.7rem', padding: '8px', background: 'rgba(0,0,0,0.5)' }}
                  />
                  <button
                    onClick={copyInviteLink}
                    style={{ padding: '8px 15px', fontSize: '0.8rem', borderColor: linkCopied ? 'var(--neon-green)' : 'var(--neon-pink)', color: linkCopied ? 'var(--neon-green)' : 'var(--neon-pink)' }}
                  >
                    {linkCopied ? 'OK!' : 'KOPIROVAT'}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div style={{ margin: '15px 0' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--neon-pink)', marginBottom: '5px', textTransform: 'uppercase', fontWeight: 'bold' }}>Hraci ({playersArray.length}):</p>
            <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
              <ul id="lobby-players-ul" style={{ listStyle: 'none', fontSize: '1rem', color: 'var(--neon-green)' }}>
                {playersArray.map(p => (
                  <li key={p.id}>
                    {p.id === myData.id ? '👤' : '💀'} {p.name} 
                    {roomData && Object.keys(roomData.players)[0] === p.id && <span style={{ color: 'var(--neon-pink)', marginLeft: '5px' }}>(HOST)</span>}
                    <span style={{ fontSize: '0.7rem', color: 'var(--neon-blue)', marginLeft: '5px' }}>[{p.gramy || 0}g]</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div id="lobby-chat">
            <div id="chat-messages">
              {chatMessages.map((m, i) => (
                <div key={i}><b style={{ color: 'var(--main)' }}>{m.sender}:</b> {m.text}</div>
              ))}
            </div>
            <div id="chat-input-area">
              <input
                type="text"
                id="chat-input"
                placeholder="Napsat zpravu..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => { if (e.key === 'Enter') sendChatMessage() }}
              />
              <button id="chat-send" onClick={sendChatMessage}>POSLAT</button>
            </div>
          </div>

          {myData.isHost && (
            <button 
              id="btn-start" 
              style={{ width: '100%', marginTop: '15px', borderColor: 'var(--neon-green)', color: 'var(--neon-green)' }} 
              onClick={startGame}
            >
              ROZDAT FRČKA 🔥 ({playersArray.length} {playersArray.length === 1 ? 'hráč' : playersArray.length < 5 ? 'hráči' : 'hráčů'})
            </button>
          )}
          
          {!myData.isHost && (
            <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '15px' }}>Cekam az host spusti hru...</p>
          )}
        </section>
      )}

      {/* GAME SCREEN */}
      {screen === 'game' && roomData && (
        <section className="screen active">
          <div id="leaderboard">
            {playersArray.sort((a, b) => b.score - a.score).map(p => (
              <div key={p.id} className={`lb-entry ${p.id === roomData.state.turn ? 'active-turn' : ''}`}>
                <span>{p.name} <small style={{ color: 'red' }}>{"|".repeat(p.strikes || 0)}</small></span>
                <b>{p.score}</b>
              </div>
            ))}
          </div>
          
          <div className="points-container">
            <div className="points-display">
              <span id="combined-pts" className="pts-total">{roomData.state.turnBasePoints}</span>
            </div>
            <div id="junkie-action" title="POŠLI NÁLET!" onClick={triggerEmojiSync}>💉</div>
          </div>
          
          <div id="game-area">
            <div id="dice-table">
              {renderDice()}
            </div>
            <div id="aside-storage">
              <div id="stored-dice-list">
                {roomData.state.storedDice.map((v, i) => (
                  <div key={i} className="die-s">{v}</div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="stack" style={{ flexDirection: 'row', gap: '15px', marginBottom: '20px' }}>
            <button
              id="roll-btn"
              style={{ flex: 2, height: '60px', borderColor: 'var(--neon-green)', color: 'var(--neon-green)' }}
              onClick={handleRoll}
              disabled={roomData.state.turn !== myData.id || roomData.state.isAnimating || (roomData.state.rollCount > 0 && !roomData.state.hasTakenThisRoll)}
            >
              HODIT 🎲
            </button>
            <button
              id="bank-btn"
              style={{ flex: 1, height: '60px' }}
              onClick={bankPoints}
              disabled={!(roomData.state.turn === myData.id && !roomData.state.isAnimating && roomData.state.hasTakenThisRoll && roomData.state.turnBasePoints >= 350)}
            >
              BANK 💰
            </button>
          </div>
        </section>
      )}

      {/* STATS SCREEN */}
      {screen === 'stats' && roomData && (
        <section className="screen active">
          <h1>PŘEDÁVKOVÁNÍ! 🏆</h1>
          <h2 id="winner-name" style={{ color: 'var(--neon-green)', marginBottom: '20px' }}>
            {playersArray.find(p => p.score >= WIN_SCORE)?.name.toUpperCase() || "NĚKDO TO PŘEHNAL"}
          </h2>
          <div id="stats-list">
            {playersArray.sort((a, b) => b.score - a.score).map(p => (
              <div key={p.id} className="stat-row">
                <span className="stat-name">{p.name} {p.score >= WIN_SCORE ? '👑' : ''}</span>
                <div className="stat-details">
                  <span>BODŮ: {p.score}</span>
                  <span>MATRA: {p.gramy || 0}g</span>
                  <span>SMÁZNUTÍ: {p.smazanoCount || 0}x</span>
                </div>
              </div>
            ))}
          </div>
          {myData.isHost && (
            <button id="btn-back-to-lobby" style={{ width: '100%' }} onClick={resetToLobby}>
              ZPĚT DO LOBBY 🏠
            </button>
          )}
        </section>
      )}

      <style jsx global>{`
        :root {
          --bg-dark: #0a0a0a;
          --neon-green: #39ff14;
          --neon-pink: #ff00ff;
          --neon-blue: #00ffff;
          --glass: rgba(255, 255, 255, 0.1);
          --main: var(--neon-pink);
        }

        .kostky-game {
          background-color: var(--bg-dark);
          color: white;
          min-height: 100vh;
          font-family: 'Courier New', Courier, monospace;
        }

        .floating-baggie {
          position: fixed;
          z-index: 100;
          cursor: pointer;
          opacity: 0.8;
          filter: drop-shadow(0 0 5px rgba(255,255,255,0.5));
          animation: float-around linear infinite;
          pointer-events: auto;
        }

        @keyframes float-around {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translate(var(--tx), var(--ty)) rotate(360deg); opacity: 0; }
        }

        .crystal {
          position: fixed;
          z-index: 101;
          font-size: 1.5rem;
          pointer-events: none;
          filter: drop-shadow(0 0 8px var(--neon-blue));
          animation: shatter 1.5s ease-out forwards;
        }

        @keyframes shatter {
          0% { transform: translate(0, 0) rotate(0) scale(1); opacity: 1; }
          100% { transform: translate(var(--cx), var(--cy)) rotate(var(--cr)) scale(0); opacity: 0; }
        }

        .emoji-shower {
          position: fixed;
          z-index: 99999;
          font-size: 2rem;
          pointer-events: none;
          animation: shower-down 2s forwards;
        }

        @keyframes shower-down {
          0% { transform: translateY(-10vh) translateX(0) rotate(0); opacity: 1; }
          100% { transform: translateY(110vh) translateX(var(--drift)) rotate(720deg); opacity: 0; }
        }

        @keyframes trippy {
          0% { filter: hue-rotate(0deg) contrast(1.5) saturate(2); transform: scale(1) rotate(0deg); }
          25% { filter: hue-rotate(90deg) contrast(2) saturate(3); transform: scale(1.05) rotate(1deg); }
          50% { filter: hue-rotate(180deg) invert(1) contrast(1.5); transform: scale(0.95) rotate(-1deg); }
          75% { filter: hue-rotate(270deg) contrast(2) saturate(4); transform: scale(1.05) rotate(1deg); }
          100% { filter: hue-rotate(360deg) contrast(1.5) saturate(2); transform: scale(1) rotate(0deg); }
        }

        .lsd-trip {
          animation: trippy 0.4s infinite, shake 0.1s infinite !important;
        }

        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          20% { transform: translate(-1px, -2px) rotate(-1deg); }
          40% { transform: translate(-3px, 0px) rotate(1deg); }
          60% { transform: translate(3px, 2px) rotate(0deg); }
          80% { transform: translate(1px, -1px) rotate(1deg); }
          100% { transform: translate(-1px, 2px) rotate(-1deg); }
        }

        body.rush-mode {
          animation: shake 0.2s infinite;
        }

        #snow-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1000;
          display: none;
        }

        .flake {
          position: absolute;
          background: white;
          border-radius: 50%;
          opacity: 0.8;
          animation: fall linear infinite;
        }

        @keyframes fall {
          to { transform: translateY(110vh); }
        }

        #mirror-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.9);
          z-index: 2000;
          display: none;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        #mirror-surface {
          width: 80%;
          max-width: 400px;
          height: 300px;
          background: linear-gradient(135deg, #888, #eee, #888);
          border: 10px solid #444;
          border-radius: 10px;
          position: relative;
          box-shadow: 0 0 50px white;
          cursor: crosshair;
        }

        .line-to-sniff {
          position: absolute;
          height: 6px;
          background: white;
          box-shadow: 0 0 10px white;
          border-radius: 3px;
          cursor: pointer;
          transition: opacity 0.3s;
        }

        .screen {
          display: none;
          flex-direction: column;
          width: 100%;
          height: 100%;
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
          text-align: center;
          position: relative;
          z-index: 10;
        }

        .screen.active {
          display: flex;
        }

        .kostky-game h1 {
          font-size: 2.5rem;
          color: var(--main);
          text-shadow: 0 0 20px var(--main);
          margin-bottom: 30px;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .stack {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .kostky-game input {
          background: rgba(0,0,0,0.6);
          border: 2px solid var(--main);
          padding: 15px;
          color: white;
          font-size: 1.2rem;
          border-radius: 12px;
          outline: none;
          text-align: center;
        }

        .kostky-game button {
          background: rgba(0,0,0,0.4);
          border: 2px solid var(--main);
          padding: 15px;
          color: var(--main);
          font-size: 1.2rem;
          font-weight: bold;
          cursor: pointer;
          border-radius: 12px;
          transition: 0.3s;
          text-transform: uppercase;
        }

        .kostky-game button:active {
          background: var(--main);
          color: black;
        }

        .kostky-game button:disabled {
          opacity: 0.2;
          cursor: not-allowed;
          filter: grayscale(1);
          border-color: #444;
          color: #444;
        }

        #leaderboard {
          font-size: 1rem;
          background: var(--glass);
          padding: 10px;
          border-radius: 15px;
          margin-bottom: 5px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .lb-entry {
          display: flex;
          justify-content: space-between;
          padding: 4px 10px;
          border-radius: 8px;
        }

        .lb-entry.active-turn {
          background: rgba(0, 255, 255, 0.15);
          border: 1px solid var(--neon-blue);
        }

        .points-container {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .points-display {
          background: rgba(0,0,0,0.3);
          padding: 8px 25px;
          border-radius: 20px;
          border: 1px solid var(--neon-green);
          width: fit-content;
        }

        .pts-total {
          font-size: 1.2rem;
          font-weight: 900;
          color: var(--neon-green);
        }

        #junkie-action {
          font-size: 1.8rem;
          cursor: pointer;
          filter: drop-shadow(0 0 5px var(--neon-blue));
          transition: transform 0.1s, filter 0.2s;
          user-select: none;
        }

        #junkie-action:active {
          transform: scale(0.85);
          filter: brightness(1.5);
        }

        #game-area {
          flex: 1;
          display: flex;
          position: relative;
          border: 3px solid var(--main);
          margin: 5px 0;
          background: radial-gradient(circle, #1a1a1a 0%, #000 100%);
          border-radius: 20px;
          overflow: hidden;
          min-height: 200px;
        }

        #dice-table {
          flex: 1;
          position: relative;
        }

        #aside-storage {
          width: 60px;
          border-left: 2px solid var(--main);
          background: rgba(255, 0, 255, 0.05);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px 0;
        }

        .die {
          position: absolute;
          width: 45px;
          height: 45px;
          background: #fff;
          color: black;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 1.4rem;
          font-weight: 900;
          border-radius: 8px;
          box-shadow: 0 4px 0 #bbb;
          cursor: pointer;
          user-select: none;
        }

        .die.can-take {
          box-shadow: 0 0 15px var(--neon-green);
          border: 2px solid var(--neon-green);
        }

        .die-s {
          width: 35px;
          height: 35px;
          background: white;
          color: black;
          margin-bottom: 5px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-weight: bold;
          border-radius: 5px;
          font-size: 1rem;
        }

        #msg-box {
          position: fixed;
          top: 30px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--main);
          color: black;
          padding: 12px 30px;
          border-radius: 30px;
          font-weight: bold;
          z-index: 9999;
          box-shadow: 0 0 20px var(--main);
        }

        #lobby-chat {
          background: rgba(0,0,0,0.5);
          border: 1px solid var(--main);
          border-radius: 12px;
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 250px;
          text-align: left;
        }

        #chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
          font-size: 0.8rem;
          color: #ccc;
        }

        #chat-input-area {
          display: flex;
          border-top: 1px solid var(--main);
        }

        #chat-input {
          flex: 1;
          background: transparent;
          border: none;
          color: white;
          padding: 12px;
          font-size: 0.9rem;
          outline: none;
          text-align: left;
        }

        #chat-send {
          padding: 5px 15px;
          font-size: 0.8rem;
          border: none;
          border-left: 1px solid var(--main);
          border-radius: 0;
          color: var(--neon-pink);
        }

        #stats-list {
          background: rgba(0,0,0,0.4);
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 20px;
          text-align: left;
        }

        .stat-row {
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding: 10px 0;
          display: flex;
          flex-direction: column;
        }

        .stat-row:last-child {
          border: none;
        }

        .stat-name {
          font-weight: bold;
          font-size: 1.2rem;
          color: var(--neon-blue);
          margin-bottom: 4px;
        }

        .stat-details {
          font-size: 0.8rem;
          color: #aaa;
          display: flex;
          gap: 15px;
        }
      `}</style>
    </div>
  )
}
