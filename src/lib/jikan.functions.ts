import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const BASE = "https://api.jikan.moe/v4";

export type AnimeSummary = {
  mal_id: number;
  title: string;
  image_url: string;
  score: number | null;
  episodes: number | null;
  type: string | null;
  year: number | null;
};

export type AnimeDetail = AnimeSummary & {
  synopsis: string | null;
  genres: { mal_id: number; name: string }[];
  trailer_youtube_id: string | null;
  status: string | null;
  rating: string | null;
  studios: string[];
};

function pickImage(images: any): string {
  return (
    images?.webp?.large_image_url ||
    images?.webp?.image_url ||
    images?.jpg?.large_image_url ||
    images?.jpg?.image_url ||
    ""
  );
}

function toSummary(a: any): AnimeSummary {
  return {
    mal_id: a.mal_id,
    title: a.title_english || a.title,
    image_url: pickImage(a.images),
    score: a.score ?? null,
    episodes: a.episodes ?? null,
    type: a.type ?? null,
    year: a.year ?? a.aired?.prop?.from?.year ?? null,
  };
}

async function jikan(path: string): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Jikan ${res.status}`);
  return res.json();
}

export const getTopAnime = createServerFn({ method: "GET" }).handler(async () => {
  const data = await jikan("/top/anime?limit=12");
  return (data.data as any[]).map(toSummary);
});

export const getSeasonNow = createServerFn({ method: "GET" }).handler(async () => {
  const data = await jikan("/seasons/now?limit=12&sfw=true");
  return (data.data as any[]).map(toSummary);
});

export const searchAnime = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      q: z.string().optional().default(""),
      page: z.number().int().min(1).max(50).optional().default(1),
      genre: z.string().optional().default(""),
      type: z.string().optional().default(""),
    }),
  )
  .handler(async ({ data }) => {
    const params = new URLSearchParams({
      limit: "24",
      page: String(data.page),
      sfw: "true",
      order_by: "popularity",
    });
    if (data.q) params.set("q", data.q);
    if (data.genre) params.set("genres", data.genre);
    if (data.type) params.set("type", data.type);
    const res = await jikan(`/anime?${params}`);
    return {
      items: (res.data as any[]).map(toSummary),
      hasNext: Boolean(res.pagination?.has_next_page),
      page: res.pagination?.current_page ?? data.page,
    };
  });

export const getAnimeDetail = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }): Promise<AnimeDetail | null> => {
    try {
      const res = await jikan(`/anime/${data.id}/full`);
      const a = res.data;
      if (!a) return null;
      return {
        ...toSummary(a),
        synopsis: a.synopsis ?? null,
        genres: (a.genres ?? []).map((g: any) => ({ mal_id: g.mal_id, name: g.name })),
        trailer_youtube_id: a.trailer?.youtube_id ?? null,
        status: a.status ?? null,
        rating: a.rating ?? null,
        studios: (a.studios ?? []).map((s: any) => s.name),
      };
    } catch {
      return null;
    }
  });
