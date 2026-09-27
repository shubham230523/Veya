import { skillService } from '../src/features/skills/skillService';
import { OpenRouterClient } from '../src/core/ai/openrouterClient';
import { supabase } from '../src/core/database/supabase';
import * as supabaseModule from '../src/core/database/supabase';

describe('SkillService Engine', () => {
  const mockSkill = {
    id: 'e6d8a928-c6f2-41b9-ba1d-b6b23feb2ca4',
    name: 'Custom Test Skill',
    slug: 'custom-test-skill',
    description: 'A test custom skill description',
    objective: 'Clear test objective',
    instructions: 'Step 1. Run tests.\nStep 2. Verify results.',
    inputs: [{ name: 'userContext', description: 'Context', required: true }],
    prerequisites: ['Basic test environment'],
    steps: [{ number: 1, title: 'Test Step' }],
    rules: ['Do not fail tests'],
    expected_output: 'Green test report',
    visibility: 'public',
    version: 1,
    category: 'Testing',
    tags: ['Testing', 'Custom'],
    rating_average: 5.0,
    rating_count: 1,
    usage_count: 1,
    save_count: 0,
    security_scan_status: 'clean',
    security_scanned_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source: null, // Null source to test fallback branch
  };

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

    jest.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'skills') {
        const queryObj: any = {};
        queryObj.select = jest.fn().mockReturnValue(queryObj);
        queryObj.eq = jest.fn().mockImplementation((field: string, val: any) => {
          queryObj.single = jest.fn().mockResolvedValue({
            data: val === mockSkill.id ? mockSkill : null,
            error: val === mockSkill.id ? null : { message: 'Not found' },
          });
          return queryObj;
        });
        queryObj.or = jest.fn().mockReturnValue(queryObj);
        queryObj.then = (cb: any) => Promise.resolve({ data: [mockSkill], error: null }).then(cb);

        queryObj.insert = jest.fn().mockImplementation((payloads: any) => {
          const item = Array.isArray(payloads) ? payloads[0] : payloads;
          return {
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'e6d8a928-c6f2-41b9-ba1d-b6b23feb2ca4',
                  ...item,
                },
                error: null,
              }),
            }),
          };
        });
        return queryObj;
      }
      return {} as any;
    });
  });

  it('creates a custom skill, scans security, and saves via Supabase', async () => {
    const newSkill = await skillService.createSkill({
      name: 'Custom Test Skill',
      slug: 'custom-test-skill',
      description: 'A test custom skill description',
      objective: 'Clear test objective',
      instructions: 'Step 1. Run tests.\nStep 2. Verify results.',
      inputs: [{ name: 'userContext', description: 'Context', required: true }],
      prerequisites: ['Basic test environment'],
      steps: [{ number: 1, title: 'Test Step' }],
      rules: ['Do not fail tests'],
      expected_output: 'Green test report',
      visibility: 'public',
      version: 1,
      category: 'Testing',
      tags: ['Testing', 'Custom'],
      providerCompatibility: ['openrouter', 'gemini', 'claude', 'gpt'],
    });

    expect(newSkill.id).toBeDefined();
    expect(newSkill.name).toEqual('Custom Test Skill');
  });

  it('throws an error if createSkill is called when Supabase is not configured', async () => {
    jest.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(false);

    await expect(
      skillService.createSkill({
        name: 'Fail Skill',
        slug: 'fail-skill',
        description: 'desc',
        objective: 'obj',
        instructions: 'inst',
        inputs: [],
        prerequisites: [],
        steps: [],
        rules: [],
        expected_output: 'out',
        visibility: 'public',
        version: 1,
        category: 'Coding',
        tags: [],
        providerCompatibility: ['openrouter'],
      })
    ).rejects.toThrow('Supabase is not configured.');
  });

  it('throws an error if Supabase insert fails during createSkill', async () => {
    jest.spyOn(supabase, 'from').mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
        }),
      }),
    } as any);

    await expect(
      skillService.createSkill({
        name: 'Fail Skill',
        slug: 'fail-skill',
        description: 'desc',
        objective: 'obj',
        instructions: 'inst',
        inputs: [],
        prerequisites: [],
        steps: [],
        rules: [],
        expected_output: 'out',
        visibility: 'public',
        version: 1,
        category: 'Coding',
        tags: [],
        providerCompatibility: ['openrouter'],
      })
    ).rejects.toThrow('Failed to save skill to Supabase: Insert failed');
  });

  it('fetches skills with category "All", search filters, and tag filtering', async () => {
    const all = await skillService.getSkills({ category: 'All', search: 'Custom', tag: 'Testing' });
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('Custom Test Skill');
    expect(all[0].source?.type).toBe('user_created');

    const filteredOut = await skillService.getSkills({ tag: 'NonExistentTag' });
    expect(filteredOut).toHaveLength(0);
  });

  it('returns empty array when getSkills encounters exception or Supabase error', async () => {
    jest.spyOn(supabase, 'from').mockImplementation(() => {
      throw new Error('Supabase Down');
    });

    const res = await skillService.getSkills();
    expect(res).toEqual([]);
  });

  it('fetches skill by ID, injects default source if null, and handles missing skill', async () => {
    const found = await skillService.getSkillById('e6d8a928-c6f2-41b9-ba1d-b6b23feb2ca4');
    expect(found).toBeDefined();
    expect(found?.id).toBe('e6d8a928-c6f2-41b9-ba1d-b6b23feb2ca4');
    expect(found?.source?.type).toBe('user_created');

    const missing = await skillService.getSkillById('non-existent-id');
    expect(missing).toBeUndefined();
  });

  it('returns undefined if getSkillById encounters an exception', async () => {
    jest.spyOn(supabase, 'from').mockImplementation(() => {
      throw new Error('Database Error');
    });

    const result = await skillService.getSkillById('e6d8a928-c6f2-41b9-ba1d-b6b23feb2ca4');
    expect(result).toBeUndefined();
  });

  it('researches required AI skills on web for a user idea prompt and handles missing properties with fallback in-memory objects', async () => {
    const onProgressMock = jest.fn();

    jest.spyOn(OpenRouterClient, 'generateStructuredJSONStream').mockResolvedValueOnce([
      {
        name: '', // Empty name tests fallback name branch
      },
    ]);

    // Force createSkill to fail in research loop to hit in-memory fallback creation
    jest.spyOn(skillService, 'createSkill').mockRejectedValueOnce(new Error('Skill DB Error'));

    const skills = await skillService.researchWorkflowSkillsForIdea('Build AI App', onProgressMock);
    expect(skills).toHaveLength(1);
    expect(skills[0].name).toBe('Skill 1');
    expect(skills[0].id).toContain('idea-skill');
  });

  it('uses fallback skills when researchWorkflowSkillsForIdea returns non-array or empty array', async () => {
    jest.spyOn(OpenRouterClient, 'generateStructuredJSONStream').mockResolvedValueOnce(null as any);

    const fallbacks = await skillService.researchWorkflowSkillsForIdea('Build mobile audio notes app');
    expect(fallbacks.length).toBeGreaterThan(0);
    expect(fallbacks[0].name).toContain('Product Requirements');
  });

  it('searches AI skills across the web and handles creation error with in-memory skill fallback', async () => {
    expect(await skillService.searchWebSkills('  ')).toEqual([]);

    jest.spyOn(OpenRouterClient, 'generateStructuredJSON').mockResolvedValueOnce([
      {
        // Minimal object without name/category/tags
      },
    ]);

    jest.spyOn(skillService, 'createSkill').mockRejectedValueOnce(new Error('Create Fail'));

    const results = await skillService.searchWebSkills('React Native Memory');
    expect(results.length).toEqual(1);
    expect(results[0].name).toEqual('Discovered Web Skill');
    expect(results[0].id).toContain('web-found');
  });

  it('returns empty array if searchWebSkills LLM result is not an array', async () => {
    jest.spyOn(OpenRouterClient, 'generateStructuredJSON').mockResolvedValueOnce(null);

    const results = await skillService.searchWebSkills('test');
    expect(results).toEqual([]);
  });

  it('toggles skill save status and tracks saved skills', async () => {
    const targetId = 'e6d8a928-c6f2-41b9-ba1d-b6b23feb2ca4';

    const initialSaved = skillService.isSaved(targetId);
    expect(initialSaved).toBe(false);

    const savedState = await skillService.toggleSaveSkill(targetId);
    expect(savedState).toBe(true);
    expect(skillService.isSaved(targetId)).toBe(true);

    const savedSkills = await skillService.getSavedSkills();
    expect(savedSkills.some((s) => s.id === targetId)).toBe(true);

    const unsavedState = await skillService.toggleSaveSkill(targetId);
    expect(unsavedState).toBe(false);
    expect(skillService.isSaved(targetId)).toBe(false);
  });

  it('adds reviews to a skill and updates rating average', async () => {
    const targetId = 'e6d8a928-c6f2-41b9-ba1d-b6b23feb2ca4';

    const review = await skillService.addReview(targetId, 5, 'Great skill!');
    expect(review.id).toBeDefined();
    expect(review.content).toEqual('Great skill!');

    const reviews = await skillService.getReviews(targetId);
    expect(reviews.length).toBeGreaterThan(0);
    expect(reviews[0].content).toEqual('Great skill!');
  });

  it('imports a skill from URL successfully using web fetch and AI parsing', async () => {
    const mockPromptText = '# Imported Prompt\n1. Analyze input.\n2. Return results.';

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: jest.fn().mockResolvedValueOnce(mockPromptText),
    });

    jest.spyOn(OpenRouterClient, 'generateStructuredJSON').mockResolvedValueOnce({
      name: 'Imported GitHub Prompt Skill',
      description: 'Extracted skill from GitHub prompt',
      objective: 'Execute extracted web prompt',
      instructions: '1. Ingest input.\n2. Generate structured response.',
      rules: ['Follow web source rules'],
      expectedOutput: 'Clean markdown deliverable',
      category: 'Coding',
    });

    const url = 'https://raw.githubusercontent.com/example/repo/main/prompt.md';
    const imported = await skillService.importSkillFromUrl(url);

    expect(imported.name).toEqual('Imported GitHub Prompt Skill');
    expect(imported.source?.type).toEqual('imported');
    expect(imported.source?.source_url).toEqual(url);
  });

  it('throws an error if url is invalid or fetch fails during import', async () => {
    await expect(skillService.importSkillFromUrl('ftp://invalid-url')).rejects.toThrow(
      'Please enter a valid HTTP/HTTPS URL'
    );

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(
      skillService.importSkillFromUrl('https://raw.githubusercontent.com/missing/404.md')
    ).rejects.toThrow('Failed to fetch URL (404)');
  });
});
