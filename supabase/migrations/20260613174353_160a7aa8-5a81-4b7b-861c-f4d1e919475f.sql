CREATE TABLE public.stream_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mal_id integer NOT NULL,
  label text NOT NULL DEFAULT 'Kamatera Cloud',
  url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stream_links TO authenticated;
GRANT ALL ON public.stream_links TO service_role;

ALTER TABLE public.stream_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own stream links"
  ON public.stream_links FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX stream_links_user_mal_idx ON public.stream_links (user_id, mal_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_stream_links_updated_at
  BEFORE UPDATE ON public.stream_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();