import { GameCard } from "@/components/game-card"
import { ParticleBackground } from "@/components/particle-background"

const games = [
  {
    id: "kostky",
    title: "Smažácký Kostky",
    description: "Hoď kostkami a zkus svůj smažácký štěstí! Sbírej body za kombinace a staň se králem kostek.",
    icon: "dice" as const,
    difficulty: "Lehká" as const,
    badge: "NASYPANÁ NOVINKA",
    badgeColor: "green" as const,
    emoji: "🎲",
    hoverColor: "blue" as const,
  },
  {
    id: "vybusena-kotatka",
    title: "Vybušená Koťátka",
    description: "Tahej karty a vyhni se bombě! Sbírej body a získávej speciální ochrany. Jak dlouho se vydrží?",
    icon: "users" as const,
    difficulty: "Střední" as const,
    badge: "NOVÁ HRA!",
    badgeColor: "pink" as const,
    emoji: "💣",
    hoverColor: "pink" as const,
  },
  {
    id: "conatosmazky",
    title: "Co na to Smažky?",
    description: "Uhodni nejčastější odpovědi spolubydlících. Čím víc lidí odpovědělo stejně, tím víc bodů!",
    icon: "users" as const,
    difficulty: "Střední" as const,
    badge: "Beta 1.0",
    badgeColor: "green" as const,
    emoji: "❄️",
    hoverColor: "green" as const,
  },
  {
    id: "matromat",
    title: "Matromat",
    description: "Výherní automat ve smažáckém stylu! Toč válce a vyhrávej herní měnu za skvělé kombinace.",
    icon: "slot" as const,
    difficulty: "Lehká" as const,
    badge: "VÝHERNÍ",
    badgeColor: "pink" as const,
    emoji: "🎰",
    hoverColor: "pink" as const,
  },
  {
    id: "pernikar",
    title: "Chceš být Perníkářem?",
    description: "Kvízová soutěž ve stylu Milionáře! Odpověz správně a vyhraj až milion perníků.",
    icon: "trophy" as const,
    difficulty: "Těžká" as const,
    badge: "WARNING",
    badgeColor: "badtrip" as const,
    emoji: "💀",
    hoverColor: "badtrip" as const,
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background pt-12 flex flex-col items-center justify-start overflow-x-hidden">
      <ParticleBackground />
      
      {/* Hero Section with Title */}
      <header className="relative text-center mb-10 z-10 mt-8 px-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-center uppercase tracking-[0.2em] sm:tracking-[0.3em] md:tracking-[0.5em] leading-[0.9] neon-text-pink animate-main-flicker my-2 max-w-full overflow-hidden">
          SMAŽÁCKÝ
          <br />
          DOUPĚ
        </h1>
        <div className="absolute top-[50px] sm:top-[60px] md:top-[75px] right-[-20px] sm:right-[-40px] md:right-[-80px] neon-text-green font-black text-sm sm:text-lg md:text-2xl lg:text-3xl uppercase tracking-[3px] sm:tracking-[5px] rotate-[-12deg] z-[15] pointer-events-none whitespace-nowrap animate-slogan-vibe">
          [ VŠE PRO TVŮJ DOJEZD ]
        </div>
      </header>

      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 w-[90%] max-w-[1200px] z-10 mb-16">
        {games.map((game) => (
          <GameCard key={game.id} {...game} />
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-12 mb-8 text-muted-foreground text-xs">
        &copy; 2026 VARNA ENTERTAINMENT
      </footer>
    </div>
  )
}
