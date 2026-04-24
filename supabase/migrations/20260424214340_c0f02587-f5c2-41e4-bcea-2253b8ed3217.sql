ALTER TABLE public.contents
  ADD COLUMN IF NOT EXISTS used_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_contents_approved_unused
  ON public.contents (captured_at)
  WHERE status = 'approved' AND used_at IS NULL;

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notify_edge_function(_function_name text, _payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _url text := 'https://gnqwtegdwnzcgexudvyz.supabase.co/functions/v1/' || _function_name;
BEGIN
  PERFORM net.http_post(
    url := _url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := _payload
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.on_new_content()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.notify_edge_function(
    'notify-new-content',
    jsonb_build_object('id', NEW.id, 'platform', NEW.platform, 'source_profile', NEW.source_profile)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_new_content ON public.contents;
CREATE TRIGGER trg_on_new_content
AFTER INSERT ON public.contents
FOR EACH ROW EXECUTE FUNCTION public.on_new_content();

CREATE OR REPLACE FUNCTION public.on_new_generated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.notify_edge_function(
    'notify-new-generated',
    jsonb_build_object('id', NEW.id, 'titulo', NEW.titulo, 'platform', NEW.platform, 'tema', NEW.tema)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_new_generated ON public.generated_contents;
CREATE TRIGGER trg_on_new_generated
AFTER INSERT ON public.generated_contents
FOR EACH ROW EXECUTE FUNCTION public.on_new_generated();