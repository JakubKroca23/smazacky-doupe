import { Header } from "@/components/header"
import { GameCard } from "@/components/game-card"
import { OnlinePlayers } from "@/components/online-players"
import { Gamepad2, Trophy } from "lucide-react"

const games = [
  {
    id: "kostky",
    title: "Smažácký Kostky",
    description: "Hoď kostkami a zkus svůj smažácký štěstí! Sbírej body za kombinace a staň se králem kostek.",
    icon: "dice" as const,
    difficulty: "Lehká" as const,
    playersOnline: 42,
  },
  {
    id: "conatosmazky",
    title: "Co na to Smažky?",
    description: "Uhodni nejčastější odpovědi spolubydlících. Čím víc lidí odpovědělo stejně, tím víc bodů!",
    icon: "users" as const,
    difficulty: "Střední" as const,
    playersOnline: 67,
  },
  {
    id: "matromat",
    title: "Matromat",
    description: "Výherní automat ve smažáckém stylu! Toč válce a vyhrávej herní měnu za skvělé kombinace.",
    icon: "slot" as const,
    difficulty: "Lehká" as const,
    playersOnline: 89,
  },
  {
    id: "pernikar",
    title: "Chceš být Perníkářem?",
    description: "Kvízová soutěž ve stylu Milionáře! Odpověz správně a vyhraj až milion perníků.",
    icon: "trophy" as const,
    difficulty: "Těžká" as const,
    playersOnline: 31,
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <OnlinePlayers />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-balance">
              <span className="text-foreground">Vítej smažko !  </span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-xl text-pretty">
              Hraj návykové minihry, soutěž v žebříčcích a připoj se k živým akcím.
              Tvé další nejvyšší skóre čeká!
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-primary" />
                <span>4 Hry</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-chart-4" />
                <span>Žebříčky</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Games Grid */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-primary" />
            Hrej Teď
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {games.map((game) => (
            <GameCard key={game.id} {...game} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-primary" />
              <span className="font-bold">SMAŽKA<span className="text-primary">{"DOUPĚ"}</span></span>
            </div>
            <p>Hrej. Soutěž. Vládni.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
