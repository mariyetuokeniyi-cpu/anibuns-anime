import { Link } from "@tanstack/react-router";
import type { AnimeSummary } from "@/lib/jikan.functions";
import { Sparkle } from "./decorations";

export function AnimeCard({ anime }: { anime: AnimeSummary | { mal_id: number; title: string; image_url: string | null; score?: number | null } }) {
  return (
    <Link
      to="/anime/$id"
      params={{ id: String(anime.mal_id) }}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-primary/20">
        <div className="aspect-[2/3] overflow-hidden bg-muted">
          {anime.image_url ? (
            <img
              src={anime.image_url}
              alt={anime.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
          )}
        </div>
        {"score" in anime && anime.score ? (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-semibold text-primary shadow">
            <Sparkle size={12} /> {anime.score.toFixed(1)}
          </div>
        ) : null}
      </div>
      <h3 className="mt-2 line-clamp-2 px-1 text-sm font-semibold text-foreground/90 group-hover:text-primary transition">
        {anime.title}
      </h3>
    </Link>
  );
}
