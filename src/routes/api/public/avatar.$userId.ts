import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/avatar/$userId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const userId = params.userId;
        if (!/^[0-9a-f-]{36}$/i.test(userId)) {
          return new Response("Bad request", { status: 400 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage
          .from("avatars")
          .download(`${userId}/avatar`);
        if (error || !data) return new Response("Not found", { status: 404 });
        const buf = await data.arrayBuffer();
        return new Response(buf, {
          headers: {
            "Content-Type": data.type || "image/png",
            "Cache-Control": "public, max-age=60",
          },
        });
      },
    },
  },
});
