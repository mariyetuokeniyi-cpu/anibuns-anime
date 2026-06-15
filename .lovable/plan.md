## Profile customization

Expand the profile beyond display name + avatar URL: file-based avatar upload, a list of favorite anime characters picked from anime pages, and a public profile page at `/u/:username`.

### What users get

- **Avatar upload** — pick an image file on the profile page; it's stored in Cloud storage and shown everywhere their avatar appears.
- **Favorite characters** — on any anime detail page, browse the cast and tap a heart to add a character (with their portrait + the show title) to a "Favorites" section on the profile.
- **Public profile at `/u/:username`** — anyone (signed in or not) can view a user's avatar, display name, favorite characters, and public watchlist. The username is auto-generated from the display name (slugified, uniqueness enforced) and shown on the profile page with a copyable share link.

### Page changes

- **`/_authenticated/profile`** — adds: avatar file picker (replaces / coexists with URL field), username display + "Copy public link" button, "Your favorite characters" grid with remove buttons.
- **`/anime/$id`** — when signed in, each cast card gets a heart toggle to add/remove that character as a favorite.
- **`/u/$username`** (new public route) — header with avatar, name, share button; sections for favorite characters and recent watchlist. Sets `head()` meta + og:image to the user's avatar for shareable links. Shows a friendly "not found" if the username doesn't exist.

### Technical details

**Storage**
- New private bucket `avatars`. Files stored at `{user_id}/avatar.{ext}`. RLS: owners read/write their own folder; reads exposed via signed URLs returned from the profile server fn (so we don't need a public bucket).

**Database migration**
- `profiles`: add `username text unique`, `bio text` (already covered by avatar — skip if not wanted), backfill `username` from existing `display_name` via slugify in SQL, add unique index. Allow public SELECT of `username, display_name, avatar_url, id` only (separate policy).
- New table `favorite_characters` (`user_id`, `mal_character_id`, `character_name`, `character_image_url`, `anime_mal_id`, `anime_title`, `created_at`, unique on `(user_id, mal_character_id)`). RLS: owner manages; public SELECT allowed (for the public profile page).
- GRANTs: `authenticated` full, `anon` SELECT on profiles (limited columns via policy) and `favorite_characters`, plus `watchlist` public-read policy scoped to rows whose owner has a username.

**Server functions** (`src/lib/user.functions.ts`)
- `uploadAvatar({ fileBase64, ext })` — auth required; writes to `avatars` bucket, updates `profiles.avatar_url` with signed URL (long-lived) or stores the path and resolve on read.
- `updateProfile` — extend to accept optional `username` (validated, slugified, uniqueness checked → friendly error if taken).
- `addFavoriteCharacter` / `removeFavoriteCharacter` / `getMyFavoriteCharacters` — auth required.
- New `src/lib/public-profile.functions.ts` (public, no auth middleware, uses `supabaseAdmin` loaded inside handler):
  - `getPublicProfileByUsername({ username })` → profile + favorites + recent watchlist, or null.

**Jikan**
- Extend `src/lib/jikan.functions.ts` with `getAnimeCharacters(mal_id)` (calls `https://api.jikan.moe/v4/anime/{id}/characters`).

**Routing**
- New file `src/routes/u.$username.tsx` (public, SSR on). Loader uses `ensureQueryData` on the public server fn; `head()` sets dynamic title + og:image from loader data; defines `errorComponent` + `notFoundComponent`.

### Out of scope

Bio text, theme color, and free-text character lists were not requested. Editing username after first save is supported but uniqueness errors surface inline.

```text
profile (owner edit) ──► uploadAvatar ──► storage: avatars/{uid}/avatar.png
                    └─► updateProfile (display_name, username)
                    └─► favorite_characters list (remove)

anime/$id (signed in) ──► heart on cast card ──► addFavoriteCharacter

/u/:username (public) ──► getPublicProfileByUsername ──► render avatar,
                                                          favorites, watchlist
```
