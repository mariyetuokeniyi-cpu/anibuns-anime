## AniBloom — cute anime streaming app

A pastel, kawaii-themed anime discovery app with accounts, watchlist, watch history, and YouTube trailer playback. Real anime metadata via the free Jikan (MyAnimeList) API.

### Visual design
- **Palette:** soft cream background, blush pink primary, lavender accent, mint highlights
- **Motifs:** pink cherry-blossom flowers, lavender hearts, fluffy clouds as decorative SVG/illustration accents (page corners, dividers, empty states)
- **Typography:** rounded display font for headings (e.g. Quicksand / Fredoka), soft sans for body
- **Components:** rounded-2xl cards, soft shadows, subtle hover lift, sparkle/heart hover micro-animations

### Pages (TanStack routes)
- `/` — landing: hero with clouds + flowers, "Top airing" and "Most popular" carousels (public, SSR with Jikan data)
- `/browse` — searchable, filterable grid (genre, type, status), pagination
- `/anime/$id` — detail: cover, synopsis, genres, stats, embedded YouTube trailer, "Add to watchlist" + "Mark watched" buttons
- `/auth` — sign in / sign up (email + password, plus Google)
- `/_authenticated/watchlist` — saved anime grid
- `/_authenticated/history` — recently watched
- `/_authenticated/profile` — display name, avatar, sign out

### Backend (Lovable Cloud)
- Email/password + Google sign-in
- Tables:
  - `profiles` (id → auth.users, display_name, avatar_url) with trigger to auto-create on signup
  - `watchlist` (id, user_id, mal_id, title, image_url, added_at) — unique (user_id, mal_id)
  - `watch_history` (id, user_id, mal_id, title, image_url, watched_at)
- RLS: each user reads/writes only their own rows
- All Jikan fetches happen in `createServerFn` (cached via TanStack Query); user mutations via authenticated server functions

### Technical notes
- Jikan v4 base: `https://api.jikan.moe/v4` — no API key. Endpoints used: `/top/anime`, `/seasons/now`, `/anime?q=&page=`, `/anime/{id}/full`.
- YouTube trailer comes from Jikan's `trailer.youtube_id` → embed via standard iframe
- Public route loaders prefetch via TanStack Query `ensureQueryData`
- Watchlist/history reads use `requireSupabaseAuth` middleware
- Cute SVG decorations stored in `src/assets/` (generated)

### Out of scope
- Actual episode video streaming (legal/licensing) — trailers only
- Comments, ratings, social features
- Admin panel
