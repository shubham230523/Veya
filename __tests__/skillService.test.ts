import { skillService } from '../src/features/skills/skillService';
import { OpenRouterClient } from '../src/core/ai/openrouterClient';
import * as supabaseModule from '../src/core/database/supabase';

describe('SkillService Engine', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(false);
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

  it('researches required AI skills on web for a user idea prompt', async () => {
    jest.spyOn(OpenRouterClient, 'generateStructuredJSON').mockResolvedValueOnce([
      {
        name: 'Product Requirements & Competitor Specs',
        description: 'PRD specs and competitor research',
        objective: 'Define PRD and competitor analysis',
        instructions: '1. PRD\n2. Research',
        category: 'Productivity',
        tags: ['PRD', 'Research'],
      },
      {
        name: 'React Native & Expo Architecture',
        description: 'Mobile architecture setup',
        objective: 'Design React Native architecture',
        instructions: '1. Expo Router\n2. Zustand',
        category: 'Coding',
        tags: ['React Native', 'Expo'],
      },
    ]);

    const prompt = 'I want to build an AI powered note taking app';
    const skills = await skillService.researchWorkflowSkillsForIdea(prompt);

    expect(skills.length).toEqual(2);
    expect(skills[0].name).toEqual('Product Requirements & Competitor Specs');
    expect(skills[1].name).toEqual('React Native & Expo Architecture');
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
    const newSkill = await skillService.createSkill({
      name: 'Save Test Skill',
      slug: 'save-test-skill',
      description: 'Test skill for save toggle',
      objective: 'Objective',
      instructions: 'Instructions',
      inputs: [{ name: 'userContext', description: 'Context', required: true }],
      prerequisites: ['Context'],
      steps: [{ number: 1, title: 'Step 1' }],
      rules: ['Rule 1'],
      expected_output: 'Output',
      visibility: 'public',
      version: 1,
      category: 'Coding',
      tags: ['Coding'],
      providerCompatibility: ['openrouter', 'gemini', 'claude', 'gpt'],
      source: { type: 'user_created', source_name: 'Custom', author: 'You' },
    });

    const targetId = newSkill.id;

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
    const newSkill = await skillService.createSkill({
      name: 'Review Test Skill',
      slug: 'review-test-skill',
      description: 'Test skill for reviews',
      objective: 'Objective',
      instructions: 'Instructions',
      inputs: [{ name: 'userContext', description: 'Context', required: true }],
      prerequisites: ['Context'],
      steps: [{ number: 1, title: 'Step 1' }],
      rules: ['Rule 1'],
      expected_output: 'Output',
      visibility: 'public',
      version: 1,
      category: 'Coding',
      tags: ['Coding'],
      providerCompatibility: ['openrouter', 'gemini', 'claude', 'gpt'],
      source: { type: 'user_created', source_name: 'Custom', author: 'You' },
    });

    const targetId = newSkill.id;

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
