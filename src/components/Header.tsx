import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Blossom, Heart } from "./decorations";
import { useQueryClient } from "@tanstack/react-query";

export function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-background/70 border-b border-border/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-2xl font-bold text-primary">
          <Blossom size={32} />
          <span>AniBloom</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3 text-sm font-medium">
          <NavLink to="/" exact>Home</NavLink>
          <NavLink to="/browse">Browse</NavLink>
          {user ? (
            <>
              <NavLink to="/watchlist">
                <span className="flex items-center gap-1"><Heart size={16} /> List</span>
              </NavLink>
              <NavLink to="/history">History</NavLink>
              <NavLink to="/profile">Profile</NavLink>
              <button
                onClick={signOut}
                className="ml-2 rounded-full bg-secondary text-secondary-foreground px-3 py-1.5 text-xs hover:bg-secondary/80 transition"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="ml-2 rounded-full bg-primary px-4 py-1.5 text-primary-foreground shadow-sm hover:shadow-md hover:scale-105 transition"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function NavLink({ to, children, exact }: { to: string; children: React.ReactNode; exact?: boolean }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact }}
      activeProps={{ className: "bg-primary/15 text-primary" }}
      className="rounded-full px-3 py-1.5 hover:bg-muted transition text-foreground/80"
    >
      {children}
    </Link>
  );
}
