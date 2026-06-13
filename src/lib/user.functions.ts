import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const animeInput = z.object({
  mal_id: z.number().int().positive(),
  title: z.string().min(1),
  image_url: z.string().nullable().optional(),
});

export const getWatchlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("watchlist")
      .select("*")
      .order("added_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addToWatchlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(animeInput)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("watchlist").upsert(
      {
        user_id: context.userId,
        mal_id: data.mal_id,
        title: data.title,
        image_url: data.image_url ?? null,
      },
      { onConflict: "user_id,mal_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeFromWatchlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ mal_id: z.number().int().positive() }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("watchlist")
      .delete()
      .eq("user_id", context.userId)
      .eq("mal_id", data.mal_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("watch_history")
      .select("*")
      .order("watched_at", { ascending: false })
      .limit(60);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const logWatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(animeInput)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("watch_history").insert({
      user_id: context.userId,
      mal_id: data.mal_id,
      title: data.title,
      image_url: data.image_url ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      display_name: z.string().min(1).max(60),
      avatar_url: z.string().url().or(z.literal("")).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        display_name: data.display_name,
        avatar_url: data.avatar_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const isInWatchlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ mal_id: z.number().int().positive() }))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("watchlist")
      .select("id")
      .eq("user_id", context.userId)
      .eq("mal_id", data.mal_id)
      .maybeSingle();
    return { inList: !!row };
  });
