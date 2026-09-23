-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. VEYA PROFILES
CREATE TABLE IF NOT EXISTS public.veya_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SKILLS
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES public.veya_profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    objective TEXT NOT NULL,
    inputs JSONB DEFAULT '[]'::jsonb,
    prerequisites JSONB DEFAULT '[]'::jsonb,
    instructions TEXT NOT NULL,
    steps JSONB DEFAULT '[]'::jsonb,
    rules JSONB DEFAULT '[]'::jsonb,
    expected_output TEXT NOT NULL,
    validation TEXT,
    category TEXT NOT NULL DEFAULT 'Coding',
    tags TEXT[] DEFAULT '{}'::text[],
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
    version INTEGER DEFAULT 1,
    rating_average NUMERIC(3,2) DEFAULT 0.0,
    rating_count INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    save_count INTEGER DEFAULT 0,
    security_scan_status TEXT DEFAULT 'clean' CHECK (security_scan_status IN ('clean', 'warning', 'flagged')),
    security_scanned_at TIMESTAMPTZ DEFAULT NOW(),
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SKILL VERSIONS
CREATE TABLE IF NOT EXISTS public.skill_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content JSONB NOT NULL,
    created_by UUID REFERENCES public.veya_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(skill_id, version_number)
);

-- 4. SKILL SOURCES
CREATE TABLE IF NOT EXISTS public.skill_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('community', 'github', 'official', 'user_created', 'imported')),
    source_url TEXT,
    source_name TEXT NOT NULL,
    author TEXT,
    published_at TIMESTAMPTZ,
    last_checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SKILL TAGS
CREATE TABLE IF NOT EXISTS public.skill_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    UNIQUE(skill_id, tag)
);

-- 6. SKILL RATINGS & REVIEWS
CREATE TABLE IF NOT EXISTS public.skill_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.veya_profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(skill_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.skill_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.veya_profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SKILL SAVES
CREATE TABLE IF NOT EXISTS public.skill_saves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.veya_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(skill_id, user_id)
);

-- 8. WORKFLOWS & STEPS
CREATE TABLE IF NOT EXISTS public.workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.veya_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    goal TEXT NOT NULL,
    provider_id TEXT DEFAULT 'claude',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workflow_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
    position INTEGER NOT NULL,
    custom_instructions TEXT,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector Similarity Search RPC Function
CREATE OR REPLACE FUNCTION match_skills (
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  objective TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.description,
    s.objective,
    1 - (s.embedding <=> query_embedding) AS similarity
  FROM public.skills s
  WHERE s.visibility = 'public'
    AND 1 - (s.embedding <=> query_embedding) > match_threshold
  ORDER BY s.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.veya_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON public.veya_profiles FOR SELECT USING (true);
CREATE POLICY "Users can edit own profile" ON public.veya_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public skills are viewable by everyone" ON public.skills FOR SELECT USING (visibility = 'public' OR creator_id = auth.uid());
CREATE POLICY "Users can create skills" ON public.skills FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can edit own skills" ON public.skills FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can view own workflows" ON public.workflows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can edit own workflows" ON public.workflows FOR ALL USING (auth.uid() = user_id);
