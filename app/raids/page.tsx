'use client'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skull, Swords, Heart, Zap, Trophy, Shield, Target, AlertTriangle, Lock } from "lucide-react"
import { audioManager } from "@/lib/audio-manager"
import { saveRaidCompletion } from "@/app/actions/raids"

type Enemy = {
  name: string
  hp: number
  maxHp: number
  damage: number
  icon: string
}

type RaidDefinition = {
  id: string
  name: string
  description: string
  difficulty: number
  minLevel: number
  enemies: Array<{ name: string; hp: number; damage: number; icon: string }>
  rewards: {
    xp: number
    currency: number
    smaze: number
    items: { name: string; rarity: string; slot: string; chance: number }[]
  }
  requirements: {
    health: number
    stamina: number
  }
}

const RAID_DEFINITIONS: RaidDefinition[] = [
  {
    id: "corner-dealer",
    name: "Sejmout Dilera na Rohu",
    description: "Lokální diler má dobrý stuff. Poraz ho a vezmi co má.",
    difficulty: 1,
    minLevel: 1,
    enemies: [
      { name: "Uliční Diler", hp: 50, damage: 5, icon: "🧑" },
      { name: "Jeho Pes", hp: 30, damage: 3, icon: "🐕" },
    ],
    rewards: {
      xp: 50,
      currency: 100,
      smaze: 50,
      items: [
        { name: "🧢 Čepice Dilera", rarity: "common", slot: "head", chance: 0.3 },
        { name: "👟 Rychlé Boty", rarity: "common", slot: "feet", chance: 0.2 },
      ]
    },
    requirements: { health: 20, stamina: 15 }
  },
  {
    id: "pharmacy-heist",
    name: "Vykrást Lékárnu",
    description: "Farmaceut a ochranka brání lékárnu. Poraz je a vykraď ji.",
    difficulty: 2,
    minLevel: 3,
    enemies: [
      { name: "Farmaceut", hp: 80, damage: 8, icon: "👨‍⚕️" },
      { name: "Ochranka", hp: 100, damage: 12, icon: "💂" },
      { name: "Alarm System", hp: 60, damage: 5, icon: "🚨" },
    ],
    rewards: {
      xp: 120,
      currency: 250,
      smaze: 100,
      items: [
        { name: "🥼 Lékařský Plášť", rarity: "uncommon", slot: "body", chance: 0.4 },
        { name: "💊 Léky", rarity: "rare", slot: "accessory", chance: 0.15 },
      ]
    },
    requirements: { health: 30, stamina: 25 }
  },
  {
    id: "lab-infiltration",
    name: "Infiltrovat Laboratoř",
    description: "Čistý produkt ze zdroje. Poraz strážce a chemiky.",
    difficulty: 3,
    minLevel: 5,
    enemies: [
      { name: "Vedoucí Chemik", hp: 120, damage: 15, icon: "🧑‍🔬" },
      { name: "Strážce 1", hp: 150, damage: 18, icon: "🛡️" },
      { name: "Strážce 2", hp: 150, damage: 18, icon: "🛡️" },
      { name: "Bezpečnostní Robot", hp: 100, damage: 20, icon: "🤖" },
    ],
    rewards: {
      xp: 250,
      currency: 500,
      smaze: 200,
      items: [
        { name: "🥽 Ochranné Brýle", rarity: "rare", slot: "head", chance: 0.3 },
        { name: "🧥 Laboratorní Plášť", rarity: "epic", slot: "body", chance: 0.2 },
        { name: "💎 Čistý Krystal", rarity: "legendary", slot: "accessory", chance: 0.05 },
      ]
    },
    requirements: { health: 50, stamina: 40 }
  },
  {
    id: "cartel-boss",
    name: "Boss Kartelu",
    description: "Největší hráč ve městě. Poraz ho a převezmi jeho teritorium.",
    difficulty: 5,
    minLevel: 10,
    enemies: [
      { name: "Bodyguard 1", hp: 200, damage: 25, icon: "🥷" },
      { name: "Bodyguard 2", hp: 200, damage: 25, icon: "🥷" },
      { name: "Elitní Snajpr", hp: 150, damage: 40, icon: "🎯" },
      { name: "Kartelový Boss", hp: 300, damage: 35, icon: "👑" },
      { name: "Strážní Pes", hp: 180, damage: 30, icon: "🐺" },
    ],
    rewards: {
      xp: 500,
      currency: 1000,
      smaze: 500,
      items: [
        { name: "👑 Koruna Bosse", rarity: "legendary", slot: "head", chance: 0.15 },
        { name: "💼 Kufřík s Prachy", rarity: "epic", slot: "accessory", chance: 0.25 },
        { name: "🔫 Zlatá Zbraň", rarity: "legendary", slot: "weapon", chance: 0.1 },
      ]
    },
    requirements: { health: 80, stamina: 70 }
  }
]

export default function RaidsPage() {
  const [user, setUser] = useState<any>(null)
  const [playerStats, setPlayerStats] = useState<any>(null)
  const [activeRaid, setActiveRaid] = useState<RaidDefinition | null>(null)
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [currentEnemyIndex, setCurrentEnemyIndex] = useState(0)
  const [playerHp, setPlayerHp] = useState(100)
  const [playerMaxHp, setPlayerMaxHp] = useState(100)
  const [combatLog, setCombatLog] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [battleStartTime, setBattleStartTime] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        window.location.href = "/auth/login"
        return
      }
      setUser(authUser)

      const { data: stats } = await supabase
        .from("player_stats")
        .select("*")
        .eq("user_id", authUser.id)
        .maybeSingle()

      setPlayerStats(stats || { level: 1, health: 100, stamina: 100, luck: 10, currency: 0, xp: 0, smaze: 2000 })
      setLoading(false)
    }
    loadData()
  }, [supabase])

  const canStartRaid = (raid: RaidDefinition): boolean => {
    if (!playerStats) return false
    if (playerStats.level < raid.minLevel) return false
    if (playerStats.health < raid.requirements.health) return false
    if (playerStats.stamina < raid.requirements.stamina) return false
    return true
  }

  const startRaid = async (raid: RaidDefinition) => {
    if (!canStartRaid(raid)) return

    audioManager.playSound('notification')
    setActiveRaid(raid)
    setPlayerHp(playerStats.health)
    setPlayerMaxHp(playerStats.health)
    
    // Initialize enemies
    const enemyList: Enemy[] = raid.enemies.map(e => ({
      ...e,
      maxHp: e.hp
    }))
    setEnemies(enemyList)
    setCurrentEnemyIndex(0)
    setCombatLog([`⚔️ Raid začíná: ${raid.name}!`])
    setBattleStartTime(Date.now())

    // Deduct resources
    await supabase
      .from("player_stats")
      .update({
        health: playerStats.health - raid.requirements.health,
        stamina: playerStats.stamina - raid.requirements.stamina
      })
      .eq("user_id", user.id)

    setPlayerStats({
      ...playerStats,
      health: playerStats.health - raid.requirements.health,
      stamina: playerStats.stamina - raid.requirements.stamina
    })
  }

  const attack = () => {
    if (!activeRaid || !enemies[currentEnemyIndex]) return

    const currentEnemy = enemies[currentEnemyIndex]
    
    // Player attacks
    const playerDamage = Math.floor(Math.random() * 20) + 10 + (playerStats.level * 2)
    const newEnemyHp = Math.max(0, currentEnemy.hp - playerDamage)
    
    const newEnemies = [...enemies]
    newEnemies[currentEnemyIndex] = { ...currentEnemy, hp: newEnemyHp }
    setEnemies(newEnemies)
    
    setCombatLog(prev => [`⚔️ Útočíš na ${currentEnemy.name} za ${playerDamage} damage!`, ...prev.slice(0, 9)])
    audioManager.playSound('click')

    // Check if enemy defeated
    if (newEnemyHp <= 0) {
      setCombatLog(prev => [`💀 ${currentEnemy.name} poražen!`, ...prev.slice(0, 9)])
      audioManager.playSound('coin')
      
      // Move to next enemy or complete raid
      if (currentEnemyIndex < enemies.length - 1) {
        setTimeout(() => {
          setCurrentEnemyIndex(prev => prev + 1)
          setCombatLog(prev => [`🎯 Další nepřítel: ${newEnemies[currentEnemyIndex + 1].name}!`, ...prev.slice(0, 9)])
        }, 1000)
      } else {
        setTimeout(() => {
          completeRaid(true)
        }, 1000)
      }
      return
    }

    // Enemy counter-attacks
    setTimeout(() => {
      const enemyDamage = Math.floor(Math.random() * currentEnemy.damage) + 5
      const newPlayerHp = Math.max(0, playerHp - enemyDamage)
      setPlayerHp(newPlayerHp)
      
      setCombatLog(prev => [`💢 ${currentEnemy.name} útočí za ${enemyDamage} damage!`, ...prev.slice(0, 9)])
      audioManager.playSound('lose')

      // Check if player defeated
      if (newPlayerHp <= 0) {
        setTimeout(() => {
          completeRaid(false)
        }, 1000)
      }
    }, 800)
  }

  const completeRaid = async (success: boolean) => {
    if (!activeRaid) return

    const completionTime = Math.round((Date.now() - battleStartTime) / 1000)

    if (success) {
      audioManager.playSound('win')
      
      const raid = activeRaid
      const newXP = playerStats.xp + raid.rewards.xp
      const newCurrency = playerStats.currency + raid.rewards.currency
      const newSmaze = playerStats.smaze + raid.rewards.smaze
      
      // Roll for item drops
      const droppedItems = []
      for (const item of raid.rewards.items) {
        if (Math.random() <= item.chance * (1 + playerStats.luck / 100)) {
          droppedItems.push(item)
        }
      }

      // Update player stats
      await supabase
        .from("player_stats")
        .update({
          xp: newXP,
          currency: newCurrency,
          smaze: newSmaze
        })
        .eq("user_id", user.id)

      // Add items to inventory
      for (const item of droppedItems) {
        await supabase
          .from("inventory")
          .insert({
            user_id: user.id,
            item_name: item.name,
            item_slot: item.slot,
            rarity: item.rarity,
            equipped: false
          })
      }

      // Save raid statistics
      await saveRaidCompletion({
        raidType: raid.id,
        success: true,
        timeSeconds: completionTime,
        xpEarned: raid.rewards.xp,
        currencyEarned: raid.rewards.currency,
        itemsEarned: droppedItems.map(item => ({
          name: item.name,
          icon: item.name,
          quantity: 1
        }))
      })

      setPlayerStats({ ...playerStats, xp: newXP, currency: newCurrency, smaze: newSmaze })

      alert(`✅ Raid úspěšný!
⭐ +${raid.rewards.xp} XP
💰 +${raid.rewards.currency} měny
💊 +${raid.rewards.smaze} SMAŽE
${droppedItems.length > 0 ? `🎁 Zisk: ${droppedItems.map(i => i.name).join(", ")}` : ""}`)
    } else {
      audioManager.playSound('lose')
      
      await saveRaidCompletion({
        raidType: activeRaid.id,
        success: false,
        timeSeconds: completionTime,
        xpEarned: 0,
        currencyEarned: 0,
        itemsEarned: []
      })
      
      alert("💀 Raid selhal! Byl jsi poražen.")
    }

    setActiveRaid(null)
    setEnemies([])
    setCurrentEnemyIndex(0)
    setCombatLog([])
  }

  const getDifficultyColor = (diff: number) => {
    if (diff === 1) return "text-green-400"
    if (diff === 2) return "text-yellow-400"
    if (diff === 3) return "text-orange-400"
    return "text-red-400"
  }

  const getDifficultyStars = (diff: number) => {
    return Array(diff).fill("⭐").join("")
  }

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Načítám...</p>
    </div>
  }

  // Combat view
  if (activeRaid && enemies.length > 0) {
    const currentEnemy = enemies[currentEnemyIndex]
    const isEnemyDefeated = currentEnemy && currentEnemy.hp <= 0
    const isPlayerDefeated = playerHp <= 0

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-gradient-to-b from-red-900/20 via-background to-background -z-10" />
        
        <Card className="max-w-4xl w-full border-[#ff0000]/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-[#ff0000]" style={{ textShadow: '0 0 10px #ff0000' }}>
              ⚔️ {activeRaid.name}
            </CardTitle>
            <CardDescription className="text-center">
              Nepřítel {currentEnemyIndex + 1} / {enemies.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Battle Arena */}
            <div className="grid grid-cols-2 gap-8">
              {/* Player */}
              <div className="text-center space-y-3">
                <div className="text-6xl mb-2">🦸</div>
                <div>
                  <p className="font-bold text-lg mb-1">Ty</p>
                  <Progress value={(playerHp / playerMaxHp) * 100} className="h-4 mb-1" />
                  <p className="text-sm text-muted-foreground">
                    <Heart className="h-3 w-3 inline text-red-400" /> {playerHp} / {playerMaxHp} HP
                  </p>
                </div>
              </div>

              {/* VS */}
              <div className="flex items-center justify-center">
                <Swords className="h-12 w-12 text-[#ff0000] animate-pulse" />
              </div>

              {/* Enemy */}
              <div className="text-center space-y-3">
                <div className="text-6xl mb-2">{currentEnemy?.icon}</div>
                <div>
                  <p className="font-bold text-lg mb-1">{currentEnemy?.name}</p>
                  <Progress 
                    value={currentEnemy ? (currentEnemy.hp / currentEnemy.maxHp) * 100 : 0} 
                    className="h-4 mb-1 bg-red-900/30"
                  />
                  <p className="text-sm text-muted-foreground">
                    <Skull className="h-3 w-3 inline text-red-400" /> {currentEnemy?.hp} / {currentEnemy?.maxHp} HP
                  </p>
                  <Badge variant="destructive" className="mt-2">
                    <Target className="h-3 w-3 mr-1" />
                    {currentEnemy?.damage} DMG
                  </Badge>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-center">
              <Button
                onClick={attack}
                disabled={isEnemyDefeated || isPlayerDefeated}
                size="lg"
                className="bg-gradient-to-r from-[#ff0000] to-[#ff6600] hover:from-[#ff0000]/90 hover:to-[#ff6600]/90 text-white font-bold text-xl px-12 py-6"
                style={{ boxShadow: '0 0 30px rgba(255, 0, 0, 0.5)' }}
              >
                <Swords className="mr-2 h-6 w-6" />
                ÚTOK!
              </Button>
            </div>

            {/* Combat Log */}
            <Card className="border-border/50 bg-black/20">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Bojový Log
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 max-h-48 overflow-y-auto font-mono text-xs">
                {combatLog.map((log, i) => (
                  <p key={i} className="text-muted-foreground">{log}</p>
                ))}
              </CardContent>
            </Card>

            {/* Remaining Enemies */}
            <div className="flex gap-2 justify-center flex-wrap">
              {enemies.map((enemy, index) => (
                <div
                  key={index}
                  className={`text-3xl ${index === currentEnemyIndex ? 'scale-125 animate-bounce' : ''} ${enemy.hp <= 0 ? 'opacity-20 grayscale' : ''}`}
                >
                  {enemy.icon}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Raid selection view
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-to-b from-[#ff00ff]/5 via-background to-background -z-10" />
      <div className="fixed top-40 left-1/4 w-96 h-96 bg-[#ff00ff]/10 rounded-full blur-3xl -z-10" />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-[#ff0000] mb-2" style={{ textShadow: '0 0 20px #ff0000' }}>
              ⚔️ BOJOVÉ RAIDY
            </h1>
            <p className="text-muted-foreground">Poraz nepřátele a získej XP, měnu a vzácné předměty</p>
          </div>

          {/* Player Stats Summary */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Level</p>
                  <p className="text-xl font-bold text-[#00ff00]">{playerStats?.level || 1}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Health</p>
                  <p className="text-xl font-bold text-red-400">{playerStats?.health || 100}/100</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Stamina</p>
                  <p className="text-xl font-bold text-blue-400">{playerStats?.stamina || 100}/100</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Luck</p>
                  <p className="text-xl font-bold text-yellow-400">{playerStats?.luck || 10}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">SMAŽE</p>
                  <p className="text-xl font-bold text-[#00ff00]">{playerStats?.smaze || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Raids Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {RAID_DEFINITIONS.map((raid) => {
              const canStart = canStartRaid(raid)
              const isLevelLocked = (playerStats?.level || 1) < raid.minLevel

              return (
                <Card
                  key={raid.id}
                  className={`border-border/50 bg-card/50 backdrop-blur-sm ${
                    !canStart ? 'opacity-60' : 'hover:border-[#ff0000]/50 transition-colors'
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-1 flex items-center gap-2">
                          {raid.name}
                          {isLevelLocked && <Lock className="h-4 w-4 text-red-400" />}
                        </CardTitle>
                        <p className={`text-sm font-bold ${getDifficultyColor(raid.difficulty)}`}>
                          {getDifficultyStars(raid.difficulty)}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        LVL {raid.minLevel}+
                      </Badge>
                    </div>
                    <CardDescription>{raid.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Enemies */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-semibold uppercase">Nepřátelé ({raid.enemies.length}):</p>
                      <div className="flex flex-wrap gap-2">
                        {raid.enemies.map((enemy, i) => (
                          <Badge key={i} variant="destructive" className="text-xs gap-1">
                            {enemy.icon} {enemy.name} ({enemy.hp} HP)
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Requirements */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-semibold uppercase">Náklady:</p>
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3 text-red-400" />
                          <span className={(playerStats?.health || 100) < raid.requirements.health ? 'text-red-400' : ''}>
                            -{raid.requirements.health} HP
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-blue-400" />
                          <span className={(playerStats?.stamina || 100) < raid.requirements.stamina ? 'text-red-400' : ''}>
                            -{raid.requirements.stamina} STA
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Rewards */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-semibold uppercase">Odměny:</p>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <Badge variant="secondary" className="bg-[#00ff00]/20 text-[#00ff00] border-[#00ff00]/50">
                          +{raid.rewards.xp} XP
                        </Badge>
                        <Badge variant="secondary" className="bg-yellow-400/20 text-yellow-400 border-yellow-400/50">
                          +{raid.rewards.currency} měny
                        </Badge>
                        <Badge variant="secondary" className="bg-[#ff00ff]/20 text-[#ff00ff] border-[#ff00ff]/50">
                          +{raid.rewards.smaze} SMAŽE
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {raid.rewards.items.map((item, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {item.name} ({Math.round(item.chance * 100)}%)
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Start Button */}
                    <Button
                      onClick={() => startRaid(raid)}
                      disabled={!canStart}
                      className="w-full bg-gradient-to-r from-[#ff0000] to-[#ff6600] hover:from-[#ff0000]/90 hover:to-[#ff6600]/90 text-white font-bold"
                      style={canStart ? { boxShadow: '0 0 20px #ff0000' } : {}}
                    >
                      {isLevelLocked ? `Vyžaduje Level ${raid.minLevel}` : !canStart ? 'Nedostatek zdrojů' : '⚔️ Začít Boj!'}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Info Section */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                Bojové Tipy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Poraz všechny nepřátele v raidu pro získání odměn</p>
              <p>• Tvůj útok roste s levelem - vyšší level = větší damage</p>
              <p>• Luck zvyšuje šanci na drop vzácných předmětů</p>
              <p>• Každý nepřítel má své HP a útočí zpět!</p>
              <p>• Pokud tvé HP klesne na 0, raid selže</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
