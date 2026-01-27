import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gamepad2, Mail, ArrowLeft } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#00ff00]/5 via-background to-background -z-10" />
      <div className="fixed top-20 left-1/4 w-96 h-96 bg-[#00ff00]/10 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-20 right-1/4 w-64 h-64 bg-[#ff00ff]/10 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <header className="p-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Zpět na Hry
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-xl text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="relative p-4 rounded-full bg-[#00ff00]/10 border border-[#00ff00]/30">
                <Mail className="h-10 w-10 text-[#00ff00]" style={{ filter: 'drop-shadow(0 0 10px #00ff00)' }} />
                <div className="absolute inset-0 blur-lg bg-[#00ff00]/20 -z-10 rounded-full" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              Zkontroluj si e-mail
            </CardTitle>
            <CardDescription>
              {"Poslali jsme ti potvrzovací odkaz"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Klikni na odkaz v e-mailu pro ověření účtu a začni hrát.
              Odkaz vyprší za 24 hodin.
            </p>

            <div className="flex flex-col gap-3">
              <Link href="/auth/login">
                <Button className="w-full bg-primary hover:bg-primary/90">
                  Přejít na přihlášení
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full border-border hover:bg-secondary bg-transparent">
                  <Gamepad2 className="h-4 w-4 mr-2" />
                  Prohlédnout hry
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
