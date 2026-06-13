import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getHistory } from "@/lib/user.functions";
import { AnimeCard } from "@/components/AnimeCard";
import { Sparkle } from "@/components/decorations";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "Watch history — AniBloom" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const fetchFn = useServerFn(getHistory);
  const { data, isLoading } = useQuery({ queryKey: ["history"], queryFn: () => fetchFn() });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <Sparkle size={26} />
        <h1 className="font-display text-3xl font-bold">Recently watched</h1>
      </div>
      {isLoading && <div className="text-muted-foreground">Loading...</div>}
      {data && data.length === 0 && (
        <p className="rounded-3xl border border-dashed bg-card/60 p-10 text-center text-muted-foreground">
          Nothing here yet. Mark something as watched on its detail page ✨
        </p>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {data?.map((item) => (
          <div key={item.id}>
            <AnimeCard anime={{ mal_id: item.mal_id, title: item.title, image_url: item.image_url }} />
            <p className="mt-1 px-1 text-xs text-muted-foreground">
              {new Date(item.watched_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
