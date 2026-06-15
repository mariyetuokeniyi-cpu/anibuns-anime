
-- Add username + bio to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;

-- Slugify helper
CREATE OR REPLACE FUNCTION public.slugify(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(
    regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'),
    '(^-+|-+$)', '', 'g'
  )
$$;

-- Backfill usernames
DO $$
DECLARE
  r RECORD;
  base text;
  candidate text;
  n int;
BEGIN
  FOR r IN SELECT id, display_name FROM public.profiles WHERE username IS NULL LOOP
    base := NULLIF(public.slugify(r.display_name), '');
    IF base IS NULL THEN base := 'buns-' || substr(r.id::text, 1, 8); END IF;
    candidate := base;
    n := 1;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate) LOOP
      n := n + 1;
      candidate := base || '-' || n;
    END LOOP;
    UPDATE public.profiles SET username = candidate WHERE id = r.id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON public.profiles (username);

-- Public read of basic profile columns
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.profiles;
CREATE POLICY "Public can view basic profile info"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (username IS NOT NULL);

GRANT SELECT ON public.profiles TO anon;

-- Favorite characters
CREATE TABLE IF NOT EXISTS public.favorite_characters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mal_character_id integer NOT NULL,
  character_name text NOT NULL,
  character_image_url text,
  anime_mal_id integer,
  anime_title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, mal_character_id)
);

GRANT SELECT ON public.favorite_characters TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorite_characters TO authenticated;
GRANT ALL ON public.favorite_characters TO service_role;

ALTER TABLE public.favorite_characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view favorite characters"
  ON public.favorite_characters FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users manage own favorite characters"
  ON public.favorite_characters FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public read of watchlist for public profile
CREATE POLICY "Public can view watchlist"
  ON public.watchlist FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.watchlist TO anon;

-- Storage policies for avatars bucket (private bucket, owner read/write own folder; signed URLs used for public viewing)
CREATE POLICY "Avatar owner can read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatar owner can insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatar owner can update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatar owner can delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
