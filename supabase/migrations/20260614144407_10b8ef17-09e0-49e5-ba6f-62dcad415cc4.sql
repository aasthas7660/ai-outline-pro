
CREATE TABLE public.generated_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text NOT NULL,
  section_name text,
  kind text NOT NULL DEFAULT 'section',
  image_url text NOT NULL,
  storage_path text,
  image_prompt text NOT NULL,
  image_style text NOT NULL,
  aspect_ratio text NOT NULL,
  alt_text text,
  filename text,
  saved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_images TO authenticated;
GRANT ALL ON public.generated_images TO service_role;

ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own generated_images"
  ON public.generated_images FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX generated_images_user_created_idx
  ON public.generated_images (user_id, created_at DESC);

CREATE TRIGGER set_generated_images_updated_at
  BEFORE UPDATE ON public.generated_images
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
