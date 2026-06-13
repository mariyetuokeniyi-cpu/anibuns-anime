import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getSchedule, type ScheduleDay } from "@/lib/jikan.functions";
import { Header } from "@/components/Header";
import { Cloud, Sparkle } from "@/components/decorations";

export const Route = createFileRoute("/schedule")({
  head: () => ({ meta: [{ title: "Episode Schedule · Anibuns" }] }),
  component: SchedulePage,
});

const DAYS: { key: ScheduleDay; label: string; short: string }[] = [
  { key: "monday", label: "Monday", short: "Mon" },
  { key: "tuesday", label: "Tuesday", short: "Tue" },
  { key: "wednesday", label: "Wednesday", short: "Wed" },
  { key: "thursday", label: "Thursday", short: "Thu" },
  { key: "friday", label: "Friday", short: "Fri" },
  { key: "saturday", label: "Saturday", short: "Sat" },
  { key: "sunday", label: "Sunday", short: "Sun" },
];

function todayKey(): ScheduleDay {
  const idx = (new Date().getDay() + 6) % 7; // Mon=0
  return DAYS[idx].key;
}

function SchedulePage() {
  const [day, setDay] = useState<ScheduleDay>(todayKey());
  const { data, isLoading } = useQuery({
    queryKey: ["schedule", day],
    queryFn: () => getSchedule({ data: { day } }),
    staleTime: 5 * 60_000,
  });

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Cloud size={48} />
          <div>
            <h1 className="font-display text-3xl font-bold text-primary">Episode Calendar</h1>
            <p className="text-sm text-muted-foreground">When new episodes float into the sky ☁️</p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {DAYS.map((d) => {
            const active = d.key === day;
            return (
              <button
                key={d.key}
                onClick={() => setDay(d.key)}
                className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-md scale-105"
                    : "border-border bg-card hover:bg-muted text-foreground/80"
                }`}
              >
                <span className="sm:hidden">{d.short}</span>
                <span className="hidden sm:inline">{d.label}</span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
            No episodes airing this day.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {data.map((a) => (
              <li key={a.mal_id}>
                <Link
                  to="/anime/$id"
                  params={{ id: String(a.mal_id) }}
                  className="group flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/20"
                >
                  <div className="h-24 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
                    {a.image_url && (
                      <img
                        src={a.image_url}
                        alt={a.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                    <h3 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary transition">
                      {a.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {a.broadcast_time && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                          ☁️ {a.broadcast_time}
                          {a.broadcast_timezone ? ` (${a.broadcast_timezone.split("/").pop()})` : ""}
                        </span>
                      )}
                      {a.type && <span>{a.type}</span>}
                      {a.score && (
                        <span className="flex items-center gap-0.5">
                          <Sparkle size={10} /> {a.score.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
