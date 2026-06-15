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
      bio: z.string().max(280).optional(),
      username: z.string().min(2).max(40).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    let username: string | undefined;
    if (data.username !== undefined) {
      username = data.username
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-+|-+$)/g, "");
      if (username.length < 2) throw new Error("Username must be at least 2 characters");

      const { data: existing } = await context.supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .neq("id", context.userId)
        .maybeSingle();
      if (existing) throw new Error("That username is taken 🌸");
    }

    const payload: {
      display_name: string;
      updated_at: string;
      avatar_url?: string | null;
      bio?: string | null;
      username?: string;
    } = {
      display_name: data.display_name,
      updated_at: new Date().toISOString(),
    };
    if (data.avatar_url !== undefined) payload.avatar_url = data.avatar_url || null;
    if (data.bio !== undefined) payload.bio = data.bio || null;
    if (username !== undefined) payload.username = username;

    const { error } = await context.supabase
      .from("profiles")
      .update(payload)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true, username };
  });

export const uploadAvatar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      file_base64: z.string().min(10),
      content_type: z.string().regex(/^image\/(png|jpeg|jpg|webp|gif)$/),
    }),
  )
  .handler(async ({ data, context }) => {
    const buf = Buffer.from(data.file_base64, "base64");
    if (buf.byteLength > 3 * 1024 * 1024) throw new Error("Image must be under 3 MB");
    const path = `${context.userId}/avatar`;
    const { error: upErr } = await context.supabase.storage
      .from("avatars")
      .upload(path, buf, { contentType: data.content_type, upsert: true });
    if (upErr) throw new Error(upErr.message);
    const url = `/api/public/avatar/${context.userId}?v=${Date.now()}`;
    const { error } = await context.supabase
      .from("profiles")
      .update({ avatar_url: url, updated_at: new Date().toISOString() })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { url };
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

export const getStreamLinks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ mal_id: z.number().int().positive() }))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("stream_links")
      .select("*")
      .eq("user_id", context.userId)
      .eq("mal_id", data.mal_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const addStreamLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      mal_id: z.number().int().positive(),
      label: z.string().min(1).max(60).default("Kamatera Cloud"),
      url: z.string().url(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("stream_links").insert({
      user_id: context.userId,
      mal_id: data.mal_id,
      label: data.label,
      url: data.url,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeStreamLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("stream_links")
      .delete()
      .eq("user_id", context.userId)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

