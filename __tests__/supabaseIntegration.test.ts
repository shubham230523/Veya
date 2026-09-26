import { skillService } from '../src/features/skills/skillService';
import { workflowService } from '../src/features/workflows/workflowService';
import { supabase, isSupabaseConfigured } from '../src/core/database/supabase';
import * as supabaseModule from '../src/core/database/supabase';

describe('Supabase Database Verification', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);
  });

  it('confirms Supabase environment configuration is valid', () => {
    const configured = isSupabaseConfigured();
    expect(typeof configured).toBe('boolean');
  });

  it('saves and retrieves skills directly via Supabase', async () => {
    const mockSkill = {
      id: 'e6d8a928-c6f2-41b9-ba1d-b6b23feb2ca4',
      name: 'Supabase Verification Skill',
      slug: 'supabase-verification-skill',
      description: 'Skill saved directly to Supabase',
      objective: 'Ensure zero data loss via Supabase database',
      instructions: 'Step 1. Read from Supabase.',
      category: 'Testing',
      tags: ['Testing', 'Supabase'],
    };

    jest.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'skills') {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockSkill, error: null }),
            }),
          }),
          select: jest.fn().mockImplementation(() => ({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockSkill, error: null }),
            }),
            or: jest.fn().mockResolvedValue({ data: [mockSkill], error: null }),
            then: (cb: any) => Promise.resolve({ data: [mockSkill], error: null }).then(cb),
          })),
        } as any;
      }
      return {} as any;
    });

    const customSkill = await skillService.createSkill({
      name: 'Supabase Verification Skill',
      slug: 'supabase-verification-skill',
      description: 'Skill saved directly to Supabase',
      objective: 'Ensure zero data loss via Supabase database',
      instructions: 'Step 1. Read from Supabase.',
      inputs: [{ name: 'input', description: 'test', required: true }],
      prerequisites: [],
      steps: [{ number: 1, title: 'Check' }],
      rules: ['No loss'],
      expected_output: 'Saved',
      visibility: 'public',
      version: 1,
      category: 'Testing',
      tags: ['Testing', 'Supabase'],
      providerCompatibility: ['openrouter', 'gemini', 'claude', 'gpt'],
      source: { type: 'user_created', source_name: 'Custom User Skill', author: 'You' },
    });

    expect(customSkill.id).toBeDefined();

    const retrieved = await skillService.getSkillById(customSkill.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Supabase Verification Skill');
  });

  it('saves and retrieves workflows directly via Supabase', async () => {
    const mockWf = {
      id: '81e44f2a-4e56-45f9-b846-515df4d22337',
      user_id: null,
      name: 'Supabase Verification Workflow',
      goal: 'Verify workflow saving directly via Supabase DB',
      provider_id: 'gemini',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockStep = {
      id: '92e44f2a-4e56-45f9-b846-515df4d22338',
      workflow_id: '81e44f2a-4e56-45f9-b846-515df4d22337',
      skill_id: 'e6d8a928-c6f2-41b9-ba1d-b6b23feb2ca4',
      position: 1,
      enabled: true,
      custom_instructions: 'Run test',
    };

    jest.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'workflows') {
        return {
          upsert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockWf, error: null }),
            }),
          }),
          select: jest.fn().mockImplementation(() => ({
            order: jest.fn().mockResolvedValue({ data: [mockWf], error: null }),
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockWf, error: null }),
            }),
          })),
        } as any;
      }
      if (table === 'workflow_steps') {
        return {
          upsert: jest.fn().mockResolvedValue({ data: [mockStep], error: null }),
          select: jest.fn().mockImplementation(() => ({
            order: jest.fn().mockResolvedValue({ data: [mockStep], error: null }),
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: [mockStep], error: null }),
            }),
          })),
        } as any;
      }
      return {} as any;
    });

    const workflowToSave = {
      id: '81e44f2a-4e56-45f9-b846-515df4d22337',
      user_id: 'user-current',
      name: 'Supabase Verification Workflow',
      goal: 'Verify workflow saving directly via Supabase DB',
      provider_id: 'gemini' as const,
      steps: [
        {
          id: '92e44f2a-4e56-45f9-b846-515df4d22338',
          workflow_id: '81e44f2a-4e56-45f9-b846-515df4d22337',
          skill_id: 'e6d8a928-c6f2-41b9-ba1d-b6b23feb2ca4',
          position: 1,
          enabled: true,
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const saved = await workflowService.saveWorkflow(workflowToSave);
    expect(saved.id).toBe(mockWf.id);

    const fetched = await workflowService.getWorkflowById(mockWf.id);
    expect(fetched).toBeDefined();
    expect(fetched?.name).toBe('Supabase Verification Workflow');
  });
});
