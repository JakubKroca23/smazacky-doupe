import { createClient } from "@/lib/supabase/server"
import { LeaderboardTabs } from "@/components/leaderboard-tabs"
import { Trophy, Medal, Crown } from "lucide-react"

const GAMES = [
  { id: "all", name: "Všechny Hry" },
  { id: "kostky", name: "Smažácký Kostky" },
  { id: "conatosmazky", name: "Co na to Smažky?" },
  { id: "matromat", name: "Matromat" },
  { id: "pernikar", name: "Chceš být Perníkářem?" },
]

async function getLeaderboardData(gameId: string) {
  const supabase = await createClient()
  
  let query = supabase
    .from("game_scores")
    .select(`
      id,
      score,
      game_id,
      created_at,
      profiles!inner (
        id,
        display_name,
        avatar_url
      )
    `)
    .order("score", { ascending: false })
    .limit(50)

  if (gameId !== "all") {
    query = query.eq("game_id", gameId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching leaderboard:", error)
    return []
  }

  const userBestScores = new Map<string, {
    userId: string
    displayName: string
    avatarUrl: string | null
    score: number
    gameId: string
    createdAt: string
  }>()

  for (const entry of data || []) {
    const profile = entry.profiles as { id: string; display_name: string | null; avatar_url: string | null }
    const key = gameId === "all" ? profile.id : `${profile.id}-${entry.game_id}`
    
    if (!userBestScores.has(key) || entry.score > userBestScores.get(key)!.score) {
      userBestScores.set(key, {
        userId: profile.id,
        displayName: profile.display_name || "Anonym",
        avatarUrl: profile.avatar_url,
        score: entry.score,
        gameId: entry.game_id,
        createdAt: entry.created_at,
      })
    }
  }

  return Array.from(userBestScores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>
}) {
  const params = await searchParams
  const selectedGame = params.game || "all"
  const leaderboard = await getLeaderboardData(selectedGame)

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-to-b from-[#00ff00]/5 via-background to-background -z-10" />
      <div className="fixed top-40 left-1/4 w-96 h-96 bg-[#00ff00]/10 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-20 right-1/4 w-64 h-64 bg-[#ff00ff]/10 rounded-full blur-3xl -z-10" />

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Trophy className="h-12 w-12 text-[#00ff00]" style={{ filter: 'drop-shadow(0 0 10px #00ff00)' }} />
              <div className="absolute inset-0 blur-lg bg-[#00ff00]/30 -z-10" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Žebříček</h1>
          <p className="text-muted-foreground">Nejlepší hráči soutěží o slávu</p>
        </div>

        <LeaderboardTabs games={GAMES} selectedGame={selectedGame} />

        <div className="max-w-2xl mx-auto mt-8">
          {leaderboard.length === 0 ? (
            <div className="text-center py-12 bg-card/30 rounded-xl border border-border/50">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Zatím žádná skóre. Buď první, kdo zahraje!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={`${entry.userId}-${entry.gameId}-${index}`}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                    index === 0
                      ? "bg-gradient-to-r from-[#00ff00]/20 to-[#00ff00]/5 border border-[#00ff00]/30"
                      : index === 1
                      ? "bg-gradient-to-r from-[#ff00ff]/20 to-[#ff00ff]/5 border border-[#ff00ff]/30"
                      : index === 2
                      ? "bg-gradient-to-r from-[#0088ff]/20 to-[#0088ff]/5 border border-[#0088ff]/30"
                      : "bg-card/30 border border-border/50"
                  }`}
                >
                  <div className="flex items-center justify-center w-10 h-10">
                    {index === 0 ? (
                      <Crown className="h-6 w-6 text-[#00ff00]" style={{ filter: 'drop-shadow(0 0 5px #00ff00)' }} />
                    ) : index === 1 ? (
                      <Medal className="h-6 w-6 text-[#ff00ff]" style={{ filter: 'drop-shadow(0 0 5px #ff00ff)' }} />
                    ) : index === 2 ? (
                      <Medal className="h-6 w-6 text-[#0088ff]" style={{ filter: 'drop-shadow(0 0 5px #0088ff)' }} />
                    ) : (
                      <span className="text-lg font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold">
                    {entry.displayName.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {entry.displayName}
                    </p>
                    {selectedGame === "all" && (
                      <p className="text-xs text-muted-foreground">
                        {GAMES.find((g) => g.id === entry.gameId)?.name || entry.gameId}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      index === 0 ? "text-[#00ff00]" : index === 1 ? "text-[#ff00ff]" : index === 2 ? "text-[#0088ff]" : "text-foreground"
                    }`} style={index < 3 ? { textShadow: `0 0 10px ${index === 0 ? '#00ff00' : index === 1 ? '#ff00ff' : '#0088ff'}` } : {}}>
                      {entry.score.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">bodů</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
