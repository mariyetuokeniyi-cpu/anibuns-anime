import { createFileRoute, notFound, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getAnimeDetail } from "@/lib/jikan.functions";
import {
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
  logWatch,
  getStreamLinks,
  addStreamLink,
  removeStreamLink,
} from "@/lib/user.functions";
import { useAuth } from "@/hooks/use-auth";
import { Blossom, Cloud, Heart, Sparkle } from "@/components/decorations";
import { toast } from "sonner";


const detailOpts = (id: number) =>
  queryOptions({
    queryKey: ["anime", id],
    queryFn: () => getAnimeDetail({ data: { id } }),
  });

export const Route = createFileRoute("/anime/$id")({
  head: (ctx) => {
    const loaderData = ctx.loaderData as Awaited<ReturnType<typeof getAnimeDetail>> | undefined;
    return ({
    meta: [
      { title: loaderData?.title ? `${loaderData.title} — Anibuns` : "Anime — Anibuns" },
      { name: "description", content: loaderData?.synopsis?.slice(0, 155) ?? "Anime details." },
      ...(loaderData?.image_url ? [{ property: "og:image", content: loaderData.image_url }] : []),
    ],
  })},
  loader: async ({ params, context }) => {
    const id = Number(params.id);
    if (!Number.isFinite(id)) throw notFound();
    const data = await context.queryClient.ensureQueryData(detailOpts(id));
    if (!data) throw notFound();
    return data;
  },
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-muted-foreground">Could not load: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-10 text-center">Anime not found 🌸</div>,
  component: DetailPage,
});

function DetailPage() {
  const id = Number(Route.useParams().id);
  const { data: anime } = useSuspenseQuery(detailOpts(id));
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const addFn = useServerFn(addToWatchlist);
  const removeFn = useServerFn(removeFromWatchlist);
  const checkFn = useServerFn(isInWatchlist);
  const logFn = useServerFn(logWatch);

  const { data: inListData } = useQuery({
    queryKey: ["in-watchlist", id],
    queryFn: () => checkFn({ data: { mal_id: id } }),
    enabled: !!user,
  });
  const inList = inListData?.inList ?? false;

  const toggle = useMutation({
    mutationFn: async () => {
      if (!anime) return;
      if (inList) await removeFn({ data: { mal_id: anime.mal_id } });
      else await addFn({ data: { mal_id: anime.mal_id, title: anime.title, image_url: anime.image_url } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["in-watchlist", id] });
      qc.invalidateQueries({ queryKey: ["watchlist"] });
      toast.success(inList ? "Removed from list" : "Added to list 💖");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const markWatched = useMutation({
    mutationFn: async () => {
      if (!anime) return;
      await logFn({ data: { mal_id: anime.mal_id, title: anime.title, image_url: anime.image_url } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["history"] });
      toast.success("Added to your history ✨");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!anime) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="grid gap-8 md:grid-cols-[280px_1fr]">
        <div>
          <div className="overflow-hidden rounded-3xl border bg-card shadow-md">
            <img src={anime.image_url} alt={anime.title} className="w-full" />
          </div>
        </div>

        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">{anime.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {anime.score && (
              <span className="flex items-center gap-1 rounded-full bg-primary/15 text-primary px-2 py-0.5">
                <Sparkle size={12} /> {anime.score.toFixed(1)}
              </span>
            )}
            {anime.type && <span className="rounded-full bg-muted px-2 py-0.5">{anime.type}</span>}
            {anime.episodes && <span>{anime.episodes} eps</span>}
            {anime.year && <span>{anime.year}</span>}
            {anime.status && <span>· {anime.status}</span>}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {anime.genres.map((g) => (
              <span key={g.mal_id} className="rounded-full bg-secondary text-secondary-foreground px-2.5 py-0.5 text-xs font-medium">
                {g.name}
              </span>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {user ? (
              <>
                <button
                  onClick={() => toggle.mutate()}
                  disabled={toggle.isPending}
                  className={`flex items-center gap-2 rounded-full px-5 py-2 font-semibold shadow transition hover:scale-105 ${
                    inList ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"
                  }`}
                >
                  <Heart size={18} />
                  {inList ? "In your list" : "Add to watchlist"}
                </button>
                <button
                  onClick={() => markWatched.mutate()}
                  disabled={markWatched.isPending}
                  className="rounded-full bg-accent text-accent-foreground px-5 py-2 font-semibold shadow hover:scale-105 transition"
                >
                  ✨ Mark watched
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                search={{ redirect: router.state.location.href }}
                className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 font-semibold text-primary-foreground shadow"
              >
                <Heart size={18} /> Sign in to save
              </Link>
            )}
          </div>

          {anime.synopsis && (
            <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
              {anime.synopsis}
            </p>
          )}
        </div>
      </div>

      {anime.trailer_youtube_id && (
        <section className="mt-12">
          <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-bold">
            <Blossom size={28} /> Trailer
          </h2>
          <div className="overflow-hidden rounded-3xl border bg-black shadow-lg aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${anime.trailer_youtube_id}`}
              title={`${anime.title} trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        </section>
      )}
    </div>
  );
}
