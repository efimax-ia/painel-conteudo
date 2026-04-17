-- Profiles table for authenticated users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Approval status enum
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Platform enum
CREATE TYPE public.content_platform AS ENUM ('instagram', 'tiktok', 'youtube', 'twitter', 'linkedin', 'facebook', 'other');

-- Contents table — populated by n8n
CREATE TABLE public.contents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  source_profile TEXT,
  source_url TEXT,
  platform public.content_platform DEFAULT 'other',
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  thumbnail_url TEXT,
  status public.approval_status NOT NULL DEFAULT 'pending',
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;

-- Authenticated users (the team) can see and manage all contents
CREATE POLICY "Authenticated users can view all contents"
  ON public.contents FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert contents"
  ON public.contents FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update contents"
  ON public.contents FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete contents"
  ON public.contents FOR DELETE TO authenticated USING (true);

-- Indexes for performance
CREATE INDEX idx_contents_created_at ON public.contents(created_at DESC);
CREATE INDEX idx_contents_status ON public.contents(status);
CREATE INDEX idx_contents_platform ON public.contents(platform);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contents_updated_at
  BEFORE UPDATE ON public.contents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();