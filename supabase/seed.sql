-- ==============================================================================
-- VEYA — SUPABASE POSTGRESQL SEED SCRIPT
-- ==============================================================================
-- Run this in Supabase Dashboard -> SQL Editor to seed the database with initial skills.

-- 1. Product Requirements Specification
INSERT INTO public.skills (
    id, name, slug, description, objective, inputs, prerequisites, instructions, steps, rules, expected_output, validation, visibility, version, rating_average, rating_count, usage_count, save_count, security_scan_status, category, tags
) VALUES (
    'e1f13b6d-71f0-4a8f-8d2a-111111111111',
    'Product Requirements Specification',
    'product-requirements-specification',
    'Generates a crisp, structured PRD defining user personas, feature goals, edge cases, and scope.',
    'Transform ambiguous app ideas into clear, unambiguous Product Requirement Documents (PRDs).',
    '[{"name": "appGoal", "description": "Main idea or problem statement", "required": true, "type": "string"}]'::jsonb,
    '["Basic product concept statement"]'::jsonb,
    'Analyze the product vision and draft a structured PRD covering Problem, Solution, Scope, Out of Scope, Functional Requirements, and Success Metrics.',
    '[{"number": 1, "title": "Analyze core problem & target personas"}, {"number": 2, "title": "Define key MVP features and explicitly non-goals"}, {"number": 3, "title": "Outline user flows and edge-case handling"}, {"number": 4, "title": "Specify non-functional requirements"}]'::jsonb,
    '["Strictly differentiate MVP features vs Future V2 features", "Specify actionable metrics for launch success"]'::jsonb,
    'Comprehensive Markdown PRD document ready for architecture review.',
    'Ensure all functional requirements are measurable and non-contradictory.',
    'public', 1, 4.9, 142, 1280, 512, 'clean', 'Productivity',
    ARRAY['PRD', 'Product', 'Planning', 'Requirements']
) ON CONFLICT (slug) DO NOTHING;

-- 2. Mobile UX & Screen Architecture
INSERT INTO public.skills (
    id, name, slug, description, objective, inputs, prerequisites, instructions, steps, rules, expected_output, validation, visibility, version, rating_average, rating_count, usage_count, save_count, security_scan_status, category, tags
) VALUES (
    'e1f13b6d-71f0-4a8f-8d2a-222222222222',
    'Mobile UX & Screen Architecture',
    'mobile-ux-screen-architecture',
    'Designs mobile screen navigation hierarchy, view states, safe area handling, and interaction patterns.',
    'Map out full screen hierarchies, component breakdown, and state transitions for iOS/Android apps.',
    '[{"name": "prdDocument", "description": "Product requirements or feature list", "required": true, "type": "string"}]'::jsonb,
    '["PRD or user flow definition"]'::jsonb,
    'Evaluate the PRD to produce a screen-by-screen breakdown including Navigation structure, Layout elements, View States (Loading, Empty, Error, Success), and Touch targets.',
    '[{"number": 1, "title": "Establish route structure (Tabs, Stack, Modals)"}, {"number": 2, "title": "Detail screen component breakdown and visual hierarchy"}, {"number": 3, "title": "Define empty states, loading skeletons, and error feedback"}, {"number": 4, "title": "Incorporate native mobile safe area and gesture guidelines"}]'::jsonb,
    '["Avoid desktop-stretched layouts", "Ensure all touch targets meet minimum 44x44 pt standards"]'::jsonb,
    'Detailed UX Screen Map and Component Specs.',
    'Verify every screen handles empty, loading, error, and offline states.',
    'public', 1, 4.8, 98, 850, 310, 'clean', 'Design',
    ARRAY['UX', 'Mobile', 'React Native', 'Wireframe']
) ON CONFLICT (slug) DO NOTHING;

-- 3. React Native & Expo Architecture
INSERT INTO public.skills (
    id, name, slug, description, objective, inputs, prerequisites, instructions, steps, rules, expected_output, validation, visibility, version, rating_average, rating_count, usage_count, save_count, security_scan_status, category, tags
) VALUES (
    'e1f13b6d-71f0-4a8f-8d2a-333333333333',
    'React Native & Expo Architecture',
    'react-native-expo-architecture',
    'Architects scalable Expo Router apps using modular feature folders, clean state management, and strict TypeScript.',
    'Generate robust, maintainable React Native project structures adhering to Expo SDK 57 standards.',
    '[{"name": "uxBreakdown", "description": "Screen layout and component map", "required": true, "type": "string"}]'::jsonb,
    '["UX Screen Breakdown"]'::jsonb,
    'Design the codebase folder layout, custom hooks, Zustand state stores, and Expo Router navigation hierarchy.',
    '[{"number": 1, "title": "Configure Expo Router app folder and tab layout"}, {"number": 2, "title": "Set up feature-based module folders"}, {"number": 3, "title": "Implement Zustand local state and TanStack Query server state"}, {"number": 4, "title": "Apply strict TypeScript interfaces across props and hooks"}]'::jsonb,
    '["Keep business logic out of UI view files", "Never hardcode API URLs or secrets in components"]'::jsonb,
    'Complete project folder tree, TypeScript definitions, and modular boilerplate code.',
    'Verify zero circular dependencies and strict TypeScript compliance.',
    'public', 1, 4.95, 215, 2400, 890, 'clean', 'Coding',
    ARRAY['React Native', 'Expo', 'TypeScript', 'Architecture']
) ON CONFLICT (slug) DO NOTHING;

-- 4. Supabase Database & RLS Design
INSERT INTO public.skills (
    id, name, slug, description, objective, inputs, prerequisites, instructions, steps, rules, expected_output, validation, visibility, version, rating_average, rating_count, usage_count, save_count, security_scan_status, category, tags
) VALUES (
    'e1f13b6d-71f0-4a8f-8d2a-444444444444',
    'Supabase Database & RLS Design',
    'supabase-database-rls-design',
    'Designs relational PostgreSQL schemas, vector embeddings, and bulletproof Row Level Security policies.',
    'Create secure, performant Supabase SQL schemas with pgvector and strict RLS permissions.',
    '[{"name": "domainEntities", "description": "List of entities and relationships", "required": true, "type": "string"}]'::jsonb,
    '["Entity definition"]'::jsonb,
    'Draft PostgreSQL migrations with foreign key constraints, indexes, RLS policies, and vector search functions.',
    '[{"number": 1, "title": "Define normalized table schema with proper data types"}, {"number": 2, "title": "Add indexes for high-frequency search"}, {"number": 3, "title": "Write strict RLS policies"}, {"number": 4, "title": "Implement pgvector embedding columns and RPC functions"}]'::jsonb,
    '["Never expose database service role keys to client", "Enable RLS on every created table"]'::jsonb,
    'Production-ready SQL migration scripts.',
    'Confirm RLS prevents cross-tenant data access.',
    'public', 1, 4.9, 180, 1950, 730, 'clean', 'Coding',
    ARRAY['Supabase', 'PostgreSQL', 'SQL', 'Database', 'RLS']
) ON CONFLICT (slug) DO NOTHING;

-- 5. OpenRouter AI Provider Integration
INSERT INTO public.skills (
    id, name, slug, description, objective, inputs, prerequisites, instructions, steps, rules, expected_output, validation, visibility, version, rating_average, rating_count, usage_count, save_count, security_scan_status, category, tags
) VALUES (
    'e1f13b6d-71f0-4a8f-8d2a-555555555555',
    'OpenRouter AI Provider Integration',
    'openrouter-ai-provider-integration',
    'Integrates multi-LLM providers (Gemini, Claude, GPT) with structured JSON schemas and automatic retries.',
    'Construct resilient AI client wrappers using OpenRouter, schema enforcement, and rate limit handling.',
    '[{"name": "schemaSpec", "description": "Expected AI response JSON schema", "required": true, "type": "string"}]'::jsonb,
    '["JSON Schema definition"]'::jsonb,
    'Implement OpenRouter API calls with JSON mode, prompt formatting, fallback handling, and rate limit retries.',
    '[{"number": 1, "title": "Configure OpenRouter fetch client"}, {"number": 2, "title": "Format system instructions and structured response requirements"}, {"number": 3, "title": "Implement runtime JSON schema validation"}, {"number": 4, "title": "Set up graceful fallback provider switching"}]'::jsonb,
    '["Never log raw user credentials or secrets", "Always validate model outputs before rendering"]'::jsonb,
    'Robust TypeScript AI service client.',
    'Verify JSON parsing fallback on malformed model responses.',
    'public', 1, 4.92, 165, 1720, 640, 'clean', 'AI',
    ARRAY['AI', 'OpenRouter', 'LLM', 'Claude', 'Gemini', 'GPT']
) ON CONFLICT (slug) DO NOTHING;
