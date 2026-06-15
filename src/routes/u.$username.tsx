import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getPublicProfileByUsername } from "@/lib/public-profile.functions";
import { Blossom } from "@/components/decorations";

const profileOpts = (username: string) =>
  queryOptions({
    queryKey: ["public-profile", username],
    queryFn: () => getPublicProfileByUsername({ data: { username } }),
  });

export const Route = createFileRoute("/u/$username")({
  head: (ctx) => {
    const p = ctx.loaderData as Awaited<ReturnType<typeof getPublicProfileByUsername>>;
    const name = p?.display_name || p?.username || "Profile";
    const desc = p?.bio || `${name}'s anime profile on Anibuns 🌸`;
    return {
      meta: [
        { title: `${name} — Anibuns` },
        { name: "description", content: desc.slice(0, 155) },
        { property: "og:title", content: `${name} — Anibuns` },
        { property: "og:description", content: desc.slice(0, 155) },
        ...(p?.avatar_url ? [{ property: "og:image", content: p.avatar_url }] : []),
      ],
    };
  },
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData(profileOpts(params.username));
    if (!data) throw notFound();
    return data;
  },
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-muted-foreground">Could not load: {error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <Blossom size={48} />
      <h1 className="mt-4 font-display text-2xl font-bold">No buns here 🌸</h1>
      <p className="mt-2 text-muted-foreground">That username doesn't exist yet.</p>
      <Link to="/" className="mt-4 inline-block rounded-full bg-primary px-5 py-2 font-semibold text-primary-foreground shadow">
        Home
      </Link>
    </div>
  ),
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const { username } = Route.useParams();
  const { data: p } = useSuspenseQuery(profileOpts(username));
  if (!p) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-primary/30 bg-muted shadow-md">
          {p.avatar_url ? (
            <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl">🌸</div>
          )}
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">{p.display_name || p.username}</h1>
          <div className="text-sm text-muted-foreground">@{p.username}</div>
          {p.bio && <p className="mt-2 max-w-md text-sm text-foreground/80">{p.bio}</p>}
        </div>
      </header>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-2xl font-bold">Favorite characters</h2>
        {p.favorites.length === 0 ? (
          <p className="rounded-2xl border border-dashed bg-card/50 p-6 text-center text-sm text-muted-foreground">
            No favorites yet.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {p.favorites.map((f) => (
              <div key={f.mal_character_id} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <div className="aspect-[2/3] bg-muted">
                  {f.character_image_url ? (
                    <img src={f.character_image_url} alt={f.character_name} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl">🌸</div>
                  )}
                </div>
                <div className="p-2">
                  <div className="line-clamp-1 text-xs font-semibold">{f.character_name}</div>
                  {f.anime_title && f.anime_mal_id ? (
                    <Link
                      to="/anime/$id"
                      params={{ id: String(f.anime_mal_id) }}
                      className="line-clamp-1 text-[10px] text-muted-foreground hover:text-primary"
                    >
                      {f.anime_title}
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-2xl font-bold">Watchlist</h2>
        {p.watchlist.length === 0 ? (
          <p className="rounded-2xl border border-dashed bg-card/50 p-6 text-center text-sm text-muted-foreground">
            Nothing here yet.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {p.watchlist.map((w) => (
              <Link
                key={w.mal_id}
                to="/anime/$id"
                params={{ id: String(w.mal_id) }}
                className="group block overflow-hidden rounded-2xl border bg-card shadow-sm"
              >
                <div className="aspect-[2/3] bg-muted">
                  {w.image_url ? (
                    <img src={w.image_url} alt={w.title} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl">🌸</div>
                  )}
                </div>
                <div className="p-2 text-xs font-semibold line-clamp-2">{w.title}</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
