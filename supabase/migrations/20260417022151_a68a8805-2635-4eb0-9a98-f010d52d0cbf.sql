
-- Tabela para conteúdos gerados pelos agentes
CREATE TABLE public.generated_contents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  tema TEXT,
  platform public.content_platform DEFAULT 'other',
  
  -- Conteúdo principal
  roteiro TEXT NOT NULL,
  legenda TEXT,
  hashtags TEXT,
  
  -- Ideias de capa: array de objetos {titulo, prompt}
  cover_ideas JSONB DEFAULT '[]'::jsonb,
  
  -- Referência opcional ao conteúdo de origem
  source_content_id UUID REFERENCES public.contents(id) ON DELETE SET NULL,
  
  -- Avaliação
  status public.approval_status NOT NULL DEFAULT 'pending',
  rating NUMERIC(3,1) CHECK (rating IS NULL OR (rating >= 0 AND rating <= 10)),
  observations TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadados
  agent_name TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para o agente buscar aprendizado
CREATE INDEX idx_generated_contents_status ON public.generated_contents(status);
CREATE INDEX idx_generated_contents_rating ON public.generated_contents(rating DESC NULLS LAST);
CREATE INDEX idx_generated_contents_created ON public.generated_contents(created_at DESC);

-- RLS
ALTER TABLE public.generated_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all generated contents"
ON public.generated_contents FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert generated contents"
ON public.generated_contents FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update generated contents"
ON public.generated_contents FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete generated contents"
ON public.generated_contents FOR DELETE TO authenticated USING (true);

-- Trigger updated_at
CREATE TRIGGER update_generated_contents_updated_at
BEFORE UPDATE ON public.generated_contents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para preencher reviewed_at automaticamente quando avaliado
CREATE OR REPLACE FUNCTION public.set_reviewed_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (NEW.status IS DISTINCT FROM OLD.status AND NEW.status != 'pending')
     OR (NEW.rating IS DISTINCT FROM OLD.rating)
     OR (NEW.observations IS DISTINCT FROM OLD.observations) THEN
    NEW.reviewed_at = now();
    IF NEW.reviewed_by IS NULL THEN
      NEW.reviewed_by = auth.uid();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_reviewed_at_trigger
BEFORE UPDATE ON public.generated_contents
FOR EACH ROW EXECUTE FUNCTION public.set_reviewed_at();
