import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getWatchlist, removeFromWatchlist } from "@/lib/user.functions";
import { AnimeCard } from "@/components/AnimeCard";
import { Heart, Blossom } from "@/components/decorations";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/watchlist")({
  head: () => ({ meta: [{ title: "My watchlist — Anibuns" }] }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const fetchFn = useServerFn(getWatchlist);
  const rmFn = useServerFn(removeFromWatchlist);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["watchlist"], queryFn: () => fetchFn() });

  const remove = useMutation({
    mutationFn: (mal_id: number) => rmFn({ data: { mal_id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["watchlist"] });
      toast.success("Removed 🌸");
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <Heart size={30} />
        <h1 className="font-display text-3xl font-bold">My watchlist</h1>
      </div>
      {isLoading && <div className="text-muted-foreground">Loading...</div>}
      {data && data.length === 0 && (
        <div className="rounded-3xl border border-dashed bg-card/60 p-10 text-center">
          <Blossom size={48} className="mx-auto" />
          <p className="mt-4 text-muted-foreground">Your list is empty. Go pick some favorites!</p>
          <Link to="/browse" className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-primary-foreground font-semibold shadow">
            Browse anime
          </Link>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {data?.map((item) => (
          <div key={item.id} className="relative group">
            <AnimeCard
              anime={{ mal_id: item.mal_id, title: item.title, image_url: item.image_url }}
            />
            <button
              onClick={() => remove.mutate(item.mal_id)}
              className="absolute top-2 left-2 rounded-full bg-background/90 px-2 py-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition shadow"
            >
              ✕ Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
