import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { User, Calendar, Trophy, Coins, Star, TrendingUp, Home, ShoppingBag, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileEditDialog } from "@/components/profile-edit-dialog"
import { RaidStatistics } from "@/components/raid-statistics"

async function getProfileData(userId: string) {
  const supabase = await createClient()

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()

    const { data: playerStats } = await supabase
      .from("player_stats")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    const { data: inventory } = await supabase
      .from("inventory")
      .select("*")
      .eq("user_id", userId)

    const { data: properties } = await supabase
      .from("properties")
      .select("*")
      .eq("user_id", userId)

    const { data: scores } = await supabase
      .from("game_scores")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)

    const { data: raidStats } = await supabase
      .from("raid_stats")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    return { 
      profile: profile || null, 
      playerStats: playerStats || { level: 1, xp: 0, currency: 0, health: 100, stamina: 100, luck: 10, smaze: 2000 },
      inventory: inventory || [],
      properties: properties || [],
      scores: scores || [],
      raidStats: raidStats || { 
        total_completed: 0, 
        total_success: 0, 
        total_failed: 0, 
        best_time_seconds: null, 
        total_xp_earned: 0, 
        total_currency_earned: 0,
        items_earned: []
      }
    }
  } catch (error) {
    console.error('[v0] Error loading profile data:', error)
    return { 
      profile: null, 
      playerStats: { level: 1, xp: 0, currency: 0, health: 100, stamina: 100, luck: 10, smaze: 2000 },
      inventory: [],
      properties: [],
      scores: [],
      raidStats: { 
        total_completed: 0, 
        total_success: 0, 
        total_failed: 0, 
        best_time_seconds: null, 
        total_xp_earned: 0, 
        total_currency_earned: 0,
        items_earned: []
      }
    }
  }
}

// Calculate XP needed for next level
function getXPForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1))
}

// Get item rarity color
function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'common': return 'text-gray-400'
    case 'uncommon': return 'text-green-400'
    case 'rare': return 'text-blue-400'
    case 'epic': return 'text-purple-400'
    case 'legendary': return 'text-orange-400'
    default: return 'text-gray-400'
  }
}

// Get item emoji based on type
function getItemEmoji(type: string): string {
  switch (type) {
    case 'head': return '🎩'
    case 'body': return '👕'
    case 'legs': return '👖'
    case 'feet': return '👟'
    case 'accessory': return '⌚'
    case 'weapon': return '🔫'
    default: return '📦'
  }
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { profile, playerStats, inventory, properties, scores, raidStats } = await getProfileData(user.id)

  // Calculate stats
  const totalGames = scores?.length || 0
  const xpForNextLevel = getXPForLevel((playerStats?.level || 1) + 1)
  const xpProgress = ((playerStats?.xp || 0) / xpForNextLevel) * 100

  // Get equipped items
  const equippedItems = (inventory || []).filter(item => item.equipped)

  // Get avatar parts
  const equippedHead = equippedItems.find(i => i.item_slot === 'head')
  const equippedBody = equippedItems.find(i => i.item_slot === 'body')
  const equippedLegs = equippedItems.find(i => i.item_slot === 'legs')
  const equippedFeet = equippedItems.find(i => i.item_slot === 'feet')

  const memberSince = new Date(user.created_at).toLocaleDateString("cs-CZ", {
    month: "long",
    year: "numeric",
  })

  // Avatar customization
  const avatarIcon = profile?.avatar_icon || '🎮'
  const avatarCustomization = profile?.avatar_customization || {}
  
  const getBorderClass = () => {
    if (!avatarCustomization.borderStyle || avatarCustomization.borderStyle === 'none') return ''
    const width = avatarCustomization.borderStyle === 'double' ? 'border-4' : 'border-2'
    const style = avatarCustomization.borderStyle === 'dashed' ? 'border-dashed' : 'border-solid'
    return `${width} ${style} ${avatarCustomization.borderColor || 'border-[#00ff00]/50'}`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#00ff00]/5 via-background to-background -z-10" />
      <div className="fixed top-40 right-1/4 w-96 h-96 bg-[#ff00ff]/10 rounded-full blur-3xl -z-10" />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header with Avatar and Level */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-32 h-32">
                    <div className={`w-full h-full rounded-full ${avatarCustomization.backgroundColor || 'bg-gradient-to-br from-[#00ff00]/20 to-[#ff00ff]/20'} ${getBorderClass()} flex items-center justify-center overflow-hidden`}>
                      {/* Customizable Avatar Icon */}
                      <div className="text-6xl">
                        {avatarIcon}
                      </div>
                    </div>
                    <div className="absolute -inset-2 bg-[#00ff00]/20 rounded-full blur-xl -z-10 animate-pulse" />
                    
                    {/* Level Badge */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#00ff00] text-black px-3 py-1 rounded-full font-bold text-sm shadow-lg" style={{ boxShadow: '0 0 20px #00ff00' }}>
                      LVL {playerStats?.level || 1}
                    </div>
                  </div>
                  
                  {/* Stats Bars */}
                  <div className="w-full max-w-[200px] space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-red-400">❤️ Health</span>
                        <span>{playerStats?.health || 100}/100</span>
                      </div>
                      <Progress value={playerStats?.health || 100} className="h-2 bg-red-900/30" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-blue-400">⚡ Stamina</span>
                        <span>{playerStats?.stamina || 100}/100</span>
                      </div>
                      <Progress value={playerStats?.stamina || 100} className="h-2 bg-blue-900/30" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-yellow-400">🍀 Luck</span>
                        <span>{playerStats?.luck || 10}%</span>
                      </div>
                      <Progress value={playerStats?.luck || 10} max={100} className="h-2 bg-yellow-900/30" />
                    </div>
                  </div>
                </div>

                {/* Info Section */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold text-[#00ff00] mb-1" style={{ textShadow: '0 0 10px #00ff00' }}>
                        {profile?.display_name || user.email?.split("@")[0] || "Hráč"}
                      </h1>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    
                    <ProfileEditDialog 
                      currentDisplayName={profile?.display_name || user.email?.split("@")[0] || "Hráč"}
                      currentIcon={avatarIcon}
                      currentCustomization={avatarCustomization}
                    />
                    
                    {/* Currency Display */}
                    <div className="flex gap-3">
                      <div className="flex items-center gap-1 bg-[#00ff00]/20 px-3 py-1.5 rounded-lg border border-[#00ff00]/50">
                        <Coins className="h-4 w-4 text-[#00ff00]" />
                        <span className="font-bold text-[#00ff00]">{(playerStats?.currency || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* XP Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[#ff00ff]">Experience</span>
                      <span className="text-muted-foreground">{playerStats?.xp || 0} / {xpForNextLevel} XP</span>
                    </div>
                    <Progress value={xpProgress} className="h-3 bg-secondary" />
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-secondary/30 p-3 rounded-lg border border-border/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="h-4 w-4 text-[#00ff00]" />
                        <span className="text-xs text-muted-foreground">Hry</span>
                      </div>
                      <p className="text-xl font-bold">{totalGames}</p>
                    </div>
                    
                    <div className="bg-secondary/30 p-3 rounded-lg border border-border/50">
                      <div className="flex items-center gap-2 mb-1">
                        <ShoppingBag className="h-4 w-4 text-[#ff00ff]" />
                        <span className="text-xs text-muted-foreground">Inventář</span>
                      </div>
                      <p className="text-xl font-bold">{inventory?.length || 0}</p>
                    </div>
                    
                    <div className="bg-secondary/30 p-3 rounded-lg border border-border/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Home className="h-4 w-4 text-[#0088ff]" />
                        <span className="text-xs text-muted-foreground">Nemovitosti</span>
                      </div>
                      <p className="text-xl font-bold">{properties?.length || 0}</p>
                    </div>
                    
                    <div className="bg-secondary/30 p-3 rounded-lg border border-border/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Členem</span>
                      </div>
                      <p className="text-sm font-semibold">{memberSince}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabbed Content */}
          <Tabs defaultValue="inventory" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="inventory">Inventář</TabsTrigger>
              <TabsTrigger value="properties">Nemovitosti</TabsTrigger>
              <TabsTrigger value="stats">Statistiky</TabsTrigger>
              <TabsTrigger value="raids">Raidy</TabsTrigger>
            </TabsList>

            {/* Inventory Tab */}
            <TabsContent value="inventory">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-[#ff00ff]" />
                    Inventář ({inventory?.length || 0} položek)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(inventory?.length || 0) === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Tvůj inventář je prázdný. Začni hrát raidy a získej předměty!
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {(inventory || []).map((item) => (
                        <div
                          key={item.id}
                          className={`relative p-4 rounded-lg border-2 ${
                            item.equipped 
                              ? 'border-[#00ff00] bg-[#00ff00]/10' 
                              : 'border-border/50 bg-secondary/30'
                          } hover:scale-105 transition-transform cursor-pointer`}
                        >
                          {item.equipped && (
                            <div className="absolute -top-2 -right-2 bg-[#00ff00] text-black text-xs px-2 py-0.5 rounded-full font-bold">
                              ✓
                            </div>
                          )}
                          <div className="text-center">
                            <div className="text-4xl mb-2">{getItemEmoji(item.item_slot)}</div>
                            <p className={`text-xs font-bold mb-1 ${getRarityColor(item.rarity)}`}>
                              {item.item_name}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase">{item.rarity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Properties Tab */}
            <TabsContent value="properties">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-[#0088ff]" />
                    Nemovitosti ({properties?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(properties?.length || 0) === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        Ještě nemáš žádné nemovitosti.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Vydělávej měnu v hrách a kup si vlastní doupě!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(properties || []).map((property) => (
                        <div
                          key={property.id}
                          className="p-4 rounded-lg border border-border/50 bg-secondary/30"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-bold text-lg">{property.property_name}</h3>
                              <p className="text-sm text-muted-foreground">{property.property_type}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Hodnota</p>
                              <p className="text-lg font-bold text-[#00ff00]">
                                {(property?.value || 0).toLocaleString()} 💰
                              </p>
                            </div>
                          </div>
                          {property.income_per_day > 0 && (
                            <div className="flex items-center gap-2 text-sm text-[#ff00ff]">
                              <TrendingUp className="h-4 w-4" />
                              +{property.income_per_day} měny/den
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-[#00ff00]" />
                    Herní Statistiky
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(scores?.length || 0) === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Zatím žádná skóre. Začni hrát a sleduj svůj pokrok!
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {/* Best Scores by Game */}
                      {Object.entries(
                        (scores || []).reduce((acc, score) => {
                          if (!acc[score.game_id] || score.score > acc[score.game_id].score) {
                            acc[score.game_id] = score
                          }
                          return acc
                        }, {} as Record<string, typeof scores[0]>)
                      ).map(([gameId, score]) => (
                        <div
                          key={gameId}
                          className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50"
                        >
                          <div>
                            <p className="font-semibold text-foreground capitalize">
                              {gameId.replace(/-/g, " ")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(score.created_at).toLocaleDateString("cs-CZ")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-[#00ff00]" style={{ textShadow: '0 0 10px #00ff00' }}>
                              {(score?.score || 0).toLocaleString("cs-CZ")}
                            </p>
                            <p className="text-xs text-muted-foreground">body</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Raids Tab */}
            <TabsContent value="raids">
              <RaidStatistics stats={raidStats} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
