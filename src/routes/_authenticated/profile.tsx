import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  getMyFavoriteCharacters,
  removeFavoriteCharacter,
} from "@/lib/user.functions";
import { supabase } from "@/integrations/supabase/client";
import { Blossom } from "@/components/decorations";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Anibuns" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const fetchFn = useServerFn(getProfile);
  const saveFn = useServerFn(updateProfile);
  const uploadFn = useServerFn(uploadAvatar);
  const favsFn = useServerFn(getMyFavoriteCharacters);
  const removeFavFn = useServerFn(removeFavoriteCharacter);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => fetchFn() });
  const { data: favorites = [] } = useQuery({
    queryKey: ["favorite-characters"],
    queryFn: () => favsFn(),
  });

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.display_name ?? "");
      setAvatar(profile.avatar_url ?? "");
      setUsername((profile as any).username ?? "");
      setBio((profile as any).bio ?? "");
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: () =>
      saveFn({ data: { display_name: name, avatar_url: avatar, bio, username } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Saved 🌸");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif"];
      if (!allowed.includes(file.type)) throw new Error("Use PNG, JPG, WEBP, or GIF");
      if (file.size > 3 * 1024 * 1024) throw new Error("Image must be under 3 MB");
      const buf = await file.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const b64 = btoa(binary);
      return uploadFn({ data: { file_base64: b64, content_type: file.type } });
    },
    onSuccess: (res) => {
      setAvatar(res.url);
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Avatar updated ✨");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeFav = useMutation({
    mutationFn: (mal_character_id: number) =>
      removeFavFn({ data: { mal_character_id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorite-characters"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const signOut = async () => {
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  const publicUrl =
    username && typeof window !== "undefined"
      ? `${window.location.origin}/u/${username}`
      : "";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        <Blossom size={32} />
        <h1 className="font-display text-3xl font-bold">Your profile</h1>
      </div>

      <div className="rounded-3xl border bg-card/90 backdrop-blur p-6 shadow-md space-y-5">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-full border bg-muted">
            {avatar ? (
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-3xl">🌸</div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload.mutate(f);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={upload.isPending}
              className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow disabled:opacity-50"
            >
              {upload.isPending ? "Uploading…" : "Upload photo"}
            </button>
            <span className="text-xs text-muted-foreground">PNG/JPG/WEBP, ≤3 MB</span>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground">Display name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-full border bg-background px-4 py-2 outline-none focus:ring-2 ring-primary"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground">Username (public URL)</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. sakura-buns"
            className="mt-1 w-full rounded-full border bg-background px-4 py-2 outline-none focus:ring-2 ring-primary"
          />
          {publicUrl && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Link to="/u/$username" params={{ username }} className="truncate text-primary underline">
                {publicUrl}
              </Link>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(publicUrl);
                  toast.success("Link copied");
                }}
                className="rounded-full bg-muted px-2 py-0.5"
              >
                Copy
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={280}
            rows={3}
            placeholder="A little about you & your favorite shows…"
            className="mt-1 w-full rounded-2xl border bg-background px-4 py-2 outline-none focus:ring-2 ring-primary"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground">Avatar URL (optional)</label>
          <input
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="https://… (auto-filled when you upload)"
            className="mt-1 w-full rounded-full border bg-background px-4 py-2 outline-none focus:ring-2 ring-primary"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending || !name.trim()}
            className="flex-1 rounded-full bg-primary px-5 py-2 font-semibold text-primary-foreground shadow disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={signOut}
            className="rounded-full bg-secondary px-5 py-2 font-semibold text-secondary-foreground"
          >
            Sign out
          </button>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="mb-3 font-display text-2xl font-bold">Favorite characters</h2>
        {favorites.length === 0 ? (
          <p className="rounded-2xl border border-dashed bg-card/50 p-6 text-center text-sm text-muted-foreground">
            Tap the heart on any character on an anime page to save them here 💖
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {favorites.map((f) => (
              <div key={f.mal_character_id} className="group relative overflow-hidden rounded-2xl border bg-card shadow-sm">
                <div className="aspect-[2/3] bg-muted">
                  {f.character_image_url ? (
                    <img src={f.character_image_url} alt={f.character_name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl">🌸</div>
                  )}
                </div>
                <div className="p-2">
                  <div className="line-clamp-1 text-xs font-semibold">{f.character_name}</div>
                  {f.anime_title && (
                    <div className="line-clamp-1 text-[10px] text-muted-foreground">{f.anime_title}</div>
                  )}
                </div>
                <button
                  onClick={() => removeFav.mutate(f.mal_character_id)}
                  className="absolute right-1 top-1 rounded-full bg-background/90 px-2 py-0.5 text-xs opacity-0 shadow transition group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
