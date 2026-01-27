"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skull, Target, Clock, Zap, Trophy, Star, AlertTriangle, Lock, Check } from "lucide-react"
import { audioManager } from "@/lib/audio-manager"
import { saveRaidCompletion } from "@/app/actions/raids"

type RaidDefinition = {
  id: string
  name: string
  description: string
  difficulty: number
  minLevel: number
  duration: number // seconds
  rewards: {
    xp: number
    currency: number
    items: { name: string; rarity: string; slot: string; chance: number }[]
  }
  requirements: {
    health: number
    stamina: number
    luck: number
  }
}

const RAID_DEFINITIONS: RaidDefinition[] = [
  {
    id: "corner-dealer",
    name: "Sejmout Dilera na Rohu",
    description: "Lokální diler má dobrý stuff. Čas mu to vzít.",
    difficulty: 1,
    minLevel: 1,
    duration: 30,
    rewards: {
      xp: 50,
      currency: 100,
      items: [
        { name: "🧢", rarity: "common", slot: "head", chance: 0.3 },
        { name: "👟", rarity: "common", slot: "feet", chance: 0.2 },
      ]
    },
    requirements: { health: 20, stamina: 15, luck: 5 }
  },
  {
    id: "pharmacy-heist",
    name: "Vykrást Lékárnu",
    description: "Lékárna má kvalitní léky. Potřebuješ klíče a rychlost.",
    difficulty: 2,
    minLevel: 3,
    duration: 45,
    rewards: {
      xp: 120,
      currency: 250,
      items: [
        { name: "🥼", rarity: "uncommon", slot: "body", chance: 0.4 },
        { name: "💊", rarity: "rare", slot: "accessory", chance: 0.15 },
      ]
    },
    requirements: { health: 30, stamina: 25, luck: 10 }
  },
  {
    id: "lab-infiltration",
    name: "Infiltrovat Laboratoř",
    description: "Produkt přímo ze zdroje. Riziko vysoké, reward ještě vyšší.",
    difficulty: 3,
    minLevel: 5,
    duration: 60,
    rewards: {
      xp: 250,
      currency: 500,
      items: [
        { name: "🥽", rarity: "rare", slot: "head", chance: 0.3 },
        { name: "🧥", rarity: "epic", slot: "body", chance: 0.2 },
        { name: "💎", rarity: "legendary", slot: "accessory", chance: 0.05 },
      ]
    },
    requirements: { health: 50, stamina: 40, luck: 20 }
  },
  {
    id: "cartel-boss",
    name: "Shakedown Kartelového Bosse",
    description: "Největší pes v areálu. Vezmi si jeho teritorium.",
    difficulty: 5,
    minLevel: 10,
    duration: 90,
    rewards: {
      xp: 500,
      currency: 1000,
      items: [
        { name: "👑", rarity: "legendary", slot: "head", chance: 0.15 },
        { name: "💼", rarity: "epic", slot: "accessory", chance: 0.25 },
        { name: "🔫", rarity: "legendary", slot: "weapon", chance: 0.1 },
      ]
    },
    requirements: { health: 80, stamina: 70, luck: 40 }
  }
]

export default function RaidsPage() {
  const [user, setUser] = useState<any>(null)
  const [playerStats, setPlayerStats] = useState<any>(null)
  const [activeRaid, setActiveRaid] = useState<{ raid: RaidDefinition; startTime: number } | null>(null)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)
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
        .single()

      setPlayerStats(stats || { level: 1, health: 100, stamina: 100, luck: 10, currency: 0, xp: 0 })
      setLoading(false)
    }
    loadData()
  }, [supabase])

  // Progress timer for active raid
  useEffect(() => {
    if (!activeRaid) return

    const interval = setInterval(() => {
      const elapsed = (Date.now() - activeRaid.startTime) / 1000
      const progress = Math.min((elapsed / activeRaid.raid.duration) * 100, 100)
      setProgress(progress)

      if (progress >= 100) {
        completeRaid()
      }
    }, 100)

    return () => clearInterval(interval)
  }, [activeRaid])

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
    setActiveRaid({ raid, startTime: Date.now() })
    setProgress(0)

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

  const completeRaid = async () => {
    if (!activeRaid) return

    const raid = activeRaid.raid
    const completionTime = Math.round((Date.now() - activeRaid.startTime) / 1000)
    
    // Calculate success based on luck
    const successRoll = Math.random() * 100
    const success = successRoll <= (50 + playerStats.luck)

    if (success) {
      audioManager.playSound('win')
      
      // Award XP and currency
      const newXP = playerStats.xp + raid.rewards.xp
      const newCurrency = playerStats.currency + raid.rewards.currency
      
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
          currency: newCurrency
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

      setPlayerStats({ ...playerStats, xp: newXP, currency: newCurrency })

      alert(`Raid úspěšný!
+${raid.rewards.xp} XP
+${raid.rewards.currency} měny
${droppedItems.length > 0 ? `Zisk: ${droppedItems.map(i => i.name).join(", ")}` : "Žádné předměty"}`)
    } else {
      audioManager.playSound('lose')
      
      // Save failed raid statistics
      await saveRaidCompletion({
        raidType: raid.id,
        success: false,
        timeSeconds: completionTime,
        xpEarned: 0,
        currencyEarned: 0,
        itemsEarned: []
      })
      
      alert("Raid selhal! Zkus to znovu.")
    }

    setActiveRaid(null)
    setProgress(0)
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

  if (activeRaid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full border-[#ff00ff]/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-[#ff00ff]" style={{ textShadow: '0 0 10px #ff00ff' }}>
              {activeRaid.raid.name}
            </CardTitle>
            <CardDescription className="text-center">Raid probíhá...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-pulse">🎯</div>
              <Progress value={progress} className="h-4 mb-2" />
              <p className="text-sm text-muted-foreground">
                {Math.round((activeRaid.raid.duration * progress) / 100)}s / {activeRaid.raid.duration}s
              </p>
            </div>
            
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">Možné odměny:</p>
              <div className="flex flex-wrap gap-2">
                {activeRaid.raid.rewards.items.map((item, i) => (
                  <Badge key={i} variant="outline" className={`${item.rarity === 'legendary' ? 'border-orange-400 text-orange-400' : ''}`}>
                    {item.name} ({Math.round(item.chance * 100)}%)
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-to-b from-[#ff00ff]/5 via-background to-background -z-10" />
      <div className="fixed top-40 left-1/4 w-96 h-96 bg-[#ff00ff]/10 rounded-full blur-3xl -z-10" />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-[#ff00ff] mb-2" style={{ textShadow: '0 0 20px #ff00ff' }}>
              RAIDY
            </h1>
            <p className="text-muted-foreground">Získej XP, měnu a vzácné předměty</p>
          </div>

          {/* Player Stats Summary */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Level</p>
                  <p className="text-xl font-bold text-[#00ff00]">{playerStats.level}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Health</p>
                  <p className="text-xl font-bold text-red-400">{playerStats.health}/100</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Stamina</p>
                  <p className="text-xl font-bold text-blue-400">{playerStats.stamina}/100</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Luck</p>
                  <p className="text-xl font-bold text-yellow-400">{playerStats.luck}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Měna</p>
                  <p className="text-xl font-bold text-[#00ff00]">{playerStats.currency}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Raids Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {RAID_DEFINITIONS.map((raid) => {
              const canStart = canStartRaid(raid)
              const isLevelLocked = playerStats.level < raid.minLevel

              return (
                <Card
                  key={raid.id}
                  className={`border-border/50 bg-card/50 backdrop-blur-sm ${
                    !canStart ? 'opacity-60' : 'hover:border-[#ff00ff]/50 transition-colors'
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
                    {/* Requirements */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-semibold uppercase">Náklady:</p>
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-400" />
                          <span className={playerStats.health < raid.requirements.health ? 'text-red-400' : ''}>
                            -{raid.requirements.health} HP
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-blue-400" />
                          <span className={playerStats.stamina < raid.requirements.stamina ? 'text-red-400' : ''}>
                            -{raid.requirements.stamina} STA
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{raid.duration}s</span>
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
                      className="w-full bg-gradient-to-r from-[#ff00ff] to-[#00ff00] hover:from-[#ff00ff]/90 hover:to-[#00ff00]/90 text-black font-bold"
                      style={canStart ? { boxShadow: '0 0 20px #ff00ff' } : {}}
                    >
                      {isLevelLocked ? `Vyžaduje Level ${raid.minLevel}` : !canStart ? 'Nedostatek zdrojů' : 'Začít Raid'}
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
                Tipy pro Raidy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Vyšší luck zvyšuje šanci na úspěch a drop vzácných předmětů</p>
              <p>• Health a stamina se regenerují časem nebo můžeš koupit léky</p>
              <p>• Obtížnější raidy dávají lepší odměny ale vyžadují vyšší level</p>
              <p>• Legendary předměty jsou extrémně vzácné - hodně štěstí!</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
