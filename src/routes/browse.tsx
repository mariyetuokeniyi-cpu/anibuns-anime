import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { searchAnime } from "@/lib/jikan.functions";
import { AnimeCard } from "@/components/AnimeCard";
import { Blossom } from "@/components/decorations";

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: "Browse anime — Anibuns" },
      { name: "description", content: "Search and filter anime by genre and type." },
    ],
  }),
  component: BrowsePage,
});

const GENRES = [
  { id: "", name: "All" },
  { id: "1", name: "Action" },
  { id: "4", name: "Comedy" },
  { id: "8", name: "Drama" },
  { id: "10", name: "Fantasy" },
  { id: "22", name: "Romance" },
  { id: "24", name: "Sci-Fi" },
  { id: "36", name: "Slice of Life" },
];
const TYPES = [
  { id: "", name: "Any" },
  { id: "tv", name: "TV" },
  { id: "movie", name: "Movie" },
  { id: "ova", name: "OVA" },
  { id: "special", name: "Special" },
];

function BrowsePage() {
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["browse", q, genre, type, page],
    queryFn: () => searchAnime({ data: { q, genre, type, page } }),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Blossom size={36} />
        <h1 className="font-display text-3xl font-bold">Browse</h1>
      </div>

      <div className="rounded-3xl border bg-card/80 backdrop-blur p-4 shadow-sm">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Search by title... ✨"
          aria-label="Search anime by title"
          className="w-full rounded-full border border-border bg-background px-5 py-3 outline-none ring-primary focus:ring-2 transition"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <Chip key={g.id} active={genre === g.id} onClick={() => { setGenre(g.id); setPage(1); }}>{g.name}</Chip>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <Chip key={t.id} active={type === t.id} onClick={() => { setType(t.id); setPage(1); }}>{t.name}</Chip>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {isLoading
          ? Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] animate-pulse rounded-2xl bg-muted" />
            ))
          : data?.items.map((a) => <AnimeCard key={a.mal_id} anime={a} />)}
      </div>

      {data && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-full bg-secondary px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-sm text-muted-foreground">Page {page}</span>
          <button
            disabled={!data.hasNext || isFetching}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
        active
          ? "bg-primary text-primary-foreground shadow"
          : "bg-muted text-foreground/70 hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}
