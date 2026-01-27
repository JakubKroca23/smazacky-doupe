"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Trophy, Gamepad2, Calendar, Menu, X, Volume2, VolumeX, Skull } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { audioManager } from "@/lib/audio-manager"

export function Header() {
  const pathname = usePathname()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Load mute state from localStorage
    const saved = localStorage.getItem('audio_muted')
    setIsMuted(saved === 'true')
  }, [])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = "/"
  }

  const toggleAudio = () => {
    audioManager.toggleMute()
    const newMuted = !isMuted
    setIsMuted(newMuted)
    audioManager.playSound('click')
  }

  const navItems = [
    { href: "/", label: "Hry", icon: Gamepad2 },
    { href: "/leaderboard", label: "Žebříček", icon: Trophy },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur-xl shadow-lg">
      <div className="container mx-auto flex h-12 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Gamepad2 className="h-6 w-6 text-[#00ff00] transition-all group-hover:scale-110" style={{ filter: 'drop-shadow(0 0 10px #00ff00)' }} />
          <span className="text-base font-bold tracking-wider hidden sm:block">
            <span className="text-[#00ff00]" style={{ textShadow: '0 0 10px #00ff00, 0 0 20px #00ff00' }}>SMAŽÁCKÝ</span>
            <span className="text-[#ff00ff]" style={{ textShadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff' }}> DOUPĚ</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Auth Section */}
        <div className="flex items-center gap-3">
          {/* Audio Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleAudio}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label={isMuted ? "Zapnout zvuk" : "Vypnout zvuk"}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          
          {loading ? (
            <div className="h-9 w-20 bg-secondary/50 rounded-lg animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary/50 hover:border-primary hover:bg-primary/10 gap-1.5 bg-transparent h-8 text-xs"
                >
                  <User className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline max-w-20 truncate">
                    {user.email?.split("@")[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/leaderboard" className="flex items-center gap-2 cursor-pointer">
                    <Trophy className="h-4 w-4" />
                    Moje Skóre
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-destructive cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Odhlásit se
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8 text-xs">
                  Přihlásit
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button size="sm" className="bg-primary hover:bg-primary/90 h-8 text-xs">
                  Registrace
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Otevřít menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary/20 text-primary neon-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}
