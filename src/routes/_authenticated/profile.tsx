import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "@/lib/user.functions";
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
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => fetchFn() });

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  useEffect(() => {
    if (profile) {
      setName(profile.display_name ?? "");
      setAvatar(profile.avatar_url ?? "");
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: () => saveFn({ data: { display_name: name, avatar_url: avatar } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Saved 🌸");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const signOut = async () => {
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        <Blossom size={32} />
        <h1 className="font-display text-3xl font-bold">Your profile</h1>
      </div>
      <div className="rounded-3xl border bg-card/90 backdrop-blur p-6 shadow-md space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-full border bg-muted">
            {avatar ? (
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-3xl">🌸</div>
            )}
          </div>
          <div className="text-sm text-muted-foreground">Your cozy corner</div>
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
          <label className="text-xs font-semibold text-muted-foreground">Avatar URL</label>
          <input
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="https://..."
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
    </div>
  );
}
