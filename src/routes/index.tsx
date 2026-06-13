import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getTopAnime, getSeasonNow } from "@/lib/jikan.functions";
import { AnimeCard } from "@/components/AnimeCard";
import { Blossom, Heart, Sparkle } from "@/components/decorations";
import { Link } from "@tanstack/react-router";

const topOpts = queryOptions({ queryKey: ["top-anime"], queryFn: () => getTopAnime() });
const seasonOpts = queryOptions({ queryKey: ["season-now"], queryFn: () => getSeasonNow() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AniBloom — cozy anime discovery 🌸" },
      { name: "description", content: "Pastel anime discovery. Browse top airing shows, save favorites, watch trailers." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(topOpts);
    context.queryClient.ensureQueryData(seasonOpts);
  },
  component: Index,
});

function Index() {
  const { data: top } = useSuspenseQuery(topOpts);
  const { data: season } = useSuspenseQuery(seasonOpts);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20">
      {/* Hero */}
      <section className="relative pt-12 pb-10 text-center">
        <div className="flex justify-center gap-2 mb-3">
          <Sparkle size={18} className="animate-sparkle" />
          <Blossom size={28} />
          <Heart size={22} />
        </div>
        <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight">
          A <span className="text-primary">soft</span> place to find your next
          <br />
          <span className="bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
            favorite anime
          </span>
          <span className="inline-block ml-2">🌸</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Browse, save to your watchlist, and watch trailers — all wrapped in clouds, blossoms, and lavender hearts.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/browse" className="rounded-full bg-primary px-6 py-2.5 text-primary-foreground font-semibold shadow hover:shadow-lg hover:scale-105 transition">
            Start browsing
          </Link>
        </div>
      </section>

      <Row title="Top of all time" emoji="✨" items={top} />
      <Row title="Airing this season" emoji="🌷" items={season} />
    </div>
  );
}

function Row({ title, emoji, items }: { title: string; emoji: string; items: any[] }) {
  return (
    <section className="mt-12">
      <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-bold">
        <span>{emoji}</span> {title}
      </h2>
      <div className="-mx-2 flex gap-3 overflow-x-auto pb-4 px-2 snap-x scroll-pl-2">
        {items.map((a) => (
          <div key={a.mal_id} className="w-40 flex-shrink-0 snap-start">
            <AnimeCard anime={a} />
          </div>
        ))}
      </div>
    </section>
  );
}
