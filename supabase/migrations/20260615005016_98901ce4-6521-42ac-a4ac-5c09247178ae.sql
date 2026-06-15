
CREATE OR REPLACE FUNCTION public.slugify(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT regexp_replace(
    regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'),
    '(^-+|-+$)', '', 'g'
  )
$$;
