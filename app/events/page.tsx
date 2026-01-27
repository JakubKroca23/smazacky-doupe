import { createClient } from "@/lib/supabase/server"
import { EventCard } from "@/components/event-card"
import { LiveActivity } from "@/components/live-activity"
import { Calendar, Sparkles, Clock } from "lucide-react"

interface Event {
  id: string
  title: string
  description: string
  start_time: string
  end_time: string
  reward_description: string | null
  is_active: boolean
}

async function getEvents() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  // Get active events (currently running)
  const { data: activeEvents } = await supabase
    .from("events")
    .select("*")
    .eq("is_active", true)
    .lte("start_time", now)
    .gte("end_time", now)
    .order("end_time", { ascending: true })

  // Get upcoming events
  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("*")
    .eq("is_active", true)
    .gt("start_time", now)
    .order("start_time", { ascending: true })
    .limit(5)

  // Get past events
  const { data: pastEvents } = await supabase
    .from("events")
    .select("*")
    .lt("end_time", now)
    .order("end_time", { ascending: false })
    .limit(5)

  return {
    active: (activeEvents || []) as Event[],
    upcoming: (upcomingEvents || []) as Event[],
    past: (pastEvents || []) as Event[],
  }
}

export default async function EventsPage() {
  const { active, upcoming, past } = await getEvents()

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-primary/5 via-background to-background -z-10" />
      <div className="fixed top-40 left-1/3 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-20 right-1/3 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Calendar className="h-12 w-12 text-accent" />
              <div className="absolute inset-0 blur-lg bg-accent/30 -z-10" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Akce</h1>
          <p className="text-muted-foreground">Soutěž ve speciálních akcích a vyhraj exkluzivní odměny</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-12">
          {/* Live Activity Ticker */}
          <LiveActivity />

          {/* Active Events */}
          {active.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent animate-pulse" />
                Právě Probíhá
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {active.map((event) => (
                  <EventCard key={event.id} event={event} status="active" />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming Events */}
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Připravujeme
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {upcoming.map((event) => (
                  <EventCard key={event.id} event={event} status="upcoming" />
                ))}
              </div>
            </section>
          )}

          {/* Past Events */}
          {past.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                Minulé Akce
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {past.map((event) => (
                  <EventCard key={event.id} event={event} status="past" />
                ))}
              </div>
            </section>
          )}

          {/* No Events */}
          {active.length === 0 && upcoming.length === 0 && past.length === 0 && (
            <div className="text-center py-12 bg-card/30 rounded-xl border border-border/50">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Zatím žádné akce. Brzy se vrať!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
