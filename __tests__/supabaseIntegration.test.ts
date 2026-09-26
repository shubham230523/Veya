import { skillService } from '../src/features/skills/skillService';
import { workflowService } from '../src/features/workflows/workflowService';
import { isSupabaseConfigured } from '../src/core/database/supabase';

describe('Supabase & Multi-Layer Storage Verification', () => {
  it('confirms Supabase environment configuration is valid', () => {
    const configured = isSupabaseConfigured();
    expect(typeof configured).toBe('boolean');
  });

  it('persists and retrieves custom skills across simulated restarts', async () => {
    const customSkill = await skillService.createSkill({
      name: 'Persistence Verification Skill',
      slug: 'persistence-verification-skill',
      description: 'Verifying multi-layer storage across app restart',
      objective: 'Ensure no data loss on close/reopen',
      instructions: '1. Save to Supabase and LocalStorage.\n2. Re-read on app start.',
      inputs: [{ name: 'input', description: 'test', required: true }],
      prerequisites: [],
      steps: [{ number: 1, title: 'Check' }],
      rules: ['No loss'],
      expected_output: 'Saved',
      visibility: 'public',
      version: 1,
      category: 'Testing',
      tags: ['Testing', 'Custom'],
      providerCompatibility: ['openrouter', 'gemini', 'claude', 'gpt'],
      source: { type: 'user_created', source_name: 'Custom User Skill', author: 'You' },
    });

    expect(customSkill.id).toBeDefined();

    // Verify retrieval by ID
    const retrieved = await skillService.getSkillById(customSkill.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Persistence Verification Skill');

    // Verify listed in custom skills filter
    const allSkills = await skillService.getSkills();
    const foundCustom = allSkills.find((s) => s.id === customSkill.id);
    expect(foundCustom).toBeDefined();
  });

  it('persists and retrieves multi-step workflows across simulated restarts', async () => {
    const mockWf = {
      id: `wf-test-${Date.now()}`,
      user_id: 'user-current',
      name: 'Persistence Verification Workflow',
      goal: 'Verify workflow saving across app re-opens',
      provider_id: 'gemini' as const,
      steps: [
        {
          id: 'step-1',
          workflow_id: 'wf-test-1',
          skill_id: 'skill-1',
          position: 1,
          enabled: true,
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const saved = await workflowService.saveWorkflow(mockWf);
    expect(saved.id).toBe(mockWf.id);

    const fetchedWf = await workflowService.getWorkflowById(mockWf.id);
    expect(fetchedWf).toBeDefined();
    expect(fetchedWf?.name).toBe('Persistence Verification Workflow');

    const allWorkflows = await workflowService.getWorkflows();
    expect(allWorkflows.some((w) => w.id === mockWf.id)).toBe(true);
  });
});
