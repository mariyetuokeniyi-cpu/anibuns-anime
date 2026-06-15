import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type PublicProfile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  favorites: {
    mal_character_id: number;
    character_name: string;
    character_image_url: string | null;
    anime_mal_id: number | null;
    anime_title: string | null;
  }[];
  watchlist: {
    mal_id: number;
    title: string;
    image_url: string | null;
  }[];
} | null;

export const getPublicProfileByUsername = createServerFn({ method: "GET" })
  .inputValidator(z.object({ username: z.string().min(1).max(40) }))
  .handler(async ({ data }): Promise<PublicProfile> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const username = data.username.toLowerCase();

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, username, display_name, avatar_url, bio")
      .eq("username", username)
      .maybeSingle();
    if (!profile) return null;

    const [favs, wl] = await Promise.all([
      supabaseAdmin
        .from("favorite_characters")
        .select("mal_character_id, character_name, character_image_url, anime_mal_id, anime_title")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(40),
      supabaseAdmin
        .from("watchlist")
        .select("mal_id, title, image_url")
        .eq("user_id", profile.id)
        .order("added_at", { ascending: false })
        .limit(18),
    ]);

    return {
      ...profile,
      username: profile.username!,
      favorites: favs.data ?? [],
      watchlist: wl.data ?? [],
    };
  });
