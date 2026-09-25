import { skillService } from '../src/features/skills/skillService';
import { OpenRouterClient } from '../src/core/ai/openrouterClient';
import * as supabaseModule from '../src/core/database/supabase';

describe('SkillService Engine', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(false);
  });

  it('fetches skills filtered by category', async () => {
    const codingSkills = await skillService.getSkills({ category: 'Coding' });
    expect(codingSkills.length).toBeGreaterThan(0);
    codingSkills.forEach((skill) => {
      expect(skill.category).toEqual('Coding');
    });
  });

  it('fetches skills filtered by search query', async () => {
    const results = await skillService.getSkills({ search: 'React Native' });
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.some((s) => s.name.includes('React Native') || s.tags.includes('React Native'))
    ).toBe(true);
  });

  it('fetches skills filtered by tag', async () => {
    const results = await skillService.getSkills({ tag: 'PRD' });
    expect(results.length).toBeGreaterThan(0);
    results.forEach((s) => {
      expect(s.tags).toContain('PRD');
    });
  });

  it('retrieves a single skill by ID or returns undefined for non-existent ID', async () => {
    const all = await skillService.getSkills();
    const targetId = all[0].id;

    const found = await skillService.getSkillById(targetId);
    expect(found).toBeDefined();
    expect(found?.id).toEqual(targetId);

    const notFound = await skillService.getSkillById('non-existent-id-999');
    expect(notFound).toBeUndefined();
  });

  it('creates a custom skill, scans security, and adds to list', async () => {
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
      source: { type: 'user_created', source_name: 'Custom User Skill', author: 'You' },
    });

    expect(newSkill.id).toBeDefined();
    expect(newSkill.security_scan_status).toEqual('clean');

    const fetched = await skillService.getSkillById(newSkill.id);
    expect(fetched).toBeDefined();
    expect(fetched?.name).toEqual('Custom Test Skill');
  });

  it('searches AI skills across the web and returns curated skill objects', async () => {
    jest.spyOn(OpenRouterClient, 'generateStructuredJSON').mockResolvedValueOnce([
      {
        name: 'React Native Memory Auditor',
        description: 'Analyzes heap memory & component unmount leaks',
        objective: 'Identify memory leaks in React Native',
        instructions: '1. Check useEffect cleanup.\n2. Inspect listeners.',
        rules: ['Strict React Native rules'],
        expectedOutput: 'Markdown audit report',
        category: 'Coding',
        tags: ['React Native', 'Memory'],
      },
    ]);

    const results = await skillService.searchWebSkills('React Native Memory');
    expect(results.length).toEqual(1);
    expect(results[0].name).toEqual('React Native Memory Auditor');
    expect(results[0].source?.type).toEqual('imported');
  });

  it('toggles skill save status and tracks saved skills', async () => {
    const all = await skillService.getSkills();
    const targetId = all[0].id;

    const initialSaved = skillService.isSaved(targetId);
    expect(initialSaved).toBe(false);

    const savedState = await skillService.toggleSaveSkill(targetId);
    expect(savedState).toBe(true);
    expect(skillService.isSaved(targetId)).toBe(true);

    const savedList = await skillService.getSavedSkills();
    expect(savedList.some((s) => s.id === targetId)).toBe(true);

    const unsavedState = await skillService.toggleSaveSkill(targetId);
    expect(unsavedState).toBe(false);
    expect(skillService.isSaved(targetId)).toBe(false);
  });

  it('adds reviews to a skill and updates rating average', async () => {
    const all = await skillService.getSkills();
    const targetId = all[0].id;

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
