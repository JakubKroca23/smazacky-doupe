import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProfileStats } from "@/components/profile-stats"
import { ProfileScores } from "@/components/profile-scores"
import { User, Calendar, Trophy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

async function getProfileData(userId: string) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  const { data: scores } = await supabase
    .from("game_scores")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50)

  return { profile, scores: scores || [] }
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { profile, scores } = await getProfileData(user.id)

  // Calculate stats
  const totalGames = scores.length
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0)
  const bestScore = scores.length > 0 ? Math.max(...scores.map((s) => s.score)) : 0
  const averageScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0

  // Get best scores per game
  const bestScoresByGame = scores.reduce((acc, score) => {
    if (!acc[score.game_id] || score.score > acc[score.game_id].score) {
      acc[score.game_id] = score
    }
    return acc
  }, {} as Record<string, typeof scores[0]>)

  const memberSince = new Date(user.created_at).toLocaleDateString("cs-CZ", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-primary/5 via-background to-background -z-10" />
      <div className="fixed top-40 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10" />

      <main className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center">
                    <User className="h-12 w-12 text-primary" />
                  </div>
                  <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl -z-10" />
                </div>

                {/* Info */}
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl font-bold text-foreground mb-1">
                    {profile?.display_name || user.email?.split("@")[0] || "Hráč"}
                  </h1>
                  <p className="text-sm text-muted-foreground mb-3">{user.email}</p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      Členem od {memberSince}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Trophy className="h-4 w-4 text-chart-4" />
                      {totalGames} odehraných her
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <ProfileStats
            totalGames={totalGames}
            totalScore={totalScore}
            bestScore={bestScore}
            averageScore={averageScore}
          />

          {/* Best Scores by Game */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-chart-4" />
                Nejlepší Skóre
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(bestScoresByGame).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Zatím žádná skóre. Začni hrát a uvidíš svá nejlepší skóre!
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(bestScoresByGame).map(([gameId, score]) => (
                    <div
                      key={gameId}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50"
                    >
                      <div>
                        <p className="font-semibold text-foreground capitalize">
                          {gameId.replace("-", " ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(score.created_at).toLocaleDateString("cs-CZ")}
                        </p>
                      </div>
                      <p className="text-xl font-bold text-primary">
                        {score.score.toLocaleString("cs-CZ")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Scores */}
          <ProfileScores scores={scores.slice(0, 10)} />
        </div>
      </main>
    </div>
  )
}
