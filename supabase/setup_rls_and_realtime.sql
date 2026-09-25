-- ==============================================================================
-- VEYA — SUPABASE RLS PERMISSIONS & REALTIME CONFIGURATION (SAFE IDEMPOTENT)
-- ==============================================================================
-- Run this in Supabase Dashboard -> SQL Editor to enable public inserts and Realtime safely.

-- 1. UPDATE RLS INSERT POLICY FOR PUBLIC SKILLS CREATION
DROP POLICY IF EXISTS "Users can create skills" ON public.skills;

CREATE POLICY "Users can create skills"
ON public.skills FOR INSERT
WITH CHECK (visibility = 'public' OR creator_id IS NULL OR auth.uid() = creator_id);

-- 2. SAFELY ENABLE REALTIME REPLICATION (PREVENTS ALREADY-MEMBER ERRORS)
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'veya_profiles', 'skills', 'skill_versions', 'skill_sources',
    'skill_tags', 'skill_ratings', 'skill_reviews', 'skill_saves',
    'workflows', 'workflow_steps'
  ];
BEGIN
  -- Ensure publication exists
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Add table to publication only if not already a member
  FOREACH tbl IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;
