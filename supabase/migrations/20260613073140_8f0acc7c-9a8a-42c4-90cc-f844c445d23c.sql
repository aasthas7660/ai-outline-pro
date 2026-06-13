CREATE TABLE public.tool_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_type text NOT NULL,
  saved boolean NOT NULL DEFAULT false,
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tool_results TO authenticated;
GRANT ALL ON public.tool_results TO service_role;

ALTER TABLE public.tool_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tool_results" ON public.tool_results
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX tool_results_user_created_idx ON public.tool_results (user_id, created_at DESC);
CREATE INDEX tool_results_user_type_idx ON public.tool_results (user_id, tool_type);

CREATE TRIGGER set_tool_results_updated_at BEFORE UPDATE ON public.tool_results
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();