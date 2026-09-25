-- ==============================================================================
-- ENABLE SUPABASE REALTIME FOR ALL PUBLIC TABLES
-- ==============================================================================
-- Run this in Supabase Dashboard -> SQL Editor to enable Realtime subscription on all tables.

-- Ensure publication exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Enable Realtime for all Veya tables in public schema
ALTER PUBLICATION supabase_realtime ADD TABLE
    public.veya_profiles,
    public.skills,
    public.skill_versions,
    public.skill_sources,
    public.skill_tags,
    public.skill_ratings,
    public.skill_reviews,
    public.skill_saves,
    public.workflows,
    public.workflow_steps;
