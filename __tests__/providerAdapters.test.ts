import { ProviderAdapterEngine } from '../src/core/ai/providerAdapters';
import { Workflow } from '../src/types/workflow';

describe('ProviderAdapters Engine', () => {
  const mockWorkflow: Workflow = {
    id: 'wf-test-01',
    user_id: 'test-user',
    name: 'Test AI Workflow',
    description: 'Test description',
    goal: 'Build an AI-powered note-taking application',
    provider_id: 'claude',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    steps: [
      {
        id: 'step-1',
        workflow_id: 'wf-test-01',
        skill_id: 'skill-1',
        position: 1,
        enabled: true,
        customInstructions: 'Focus on performance and memory optimization.',
        skill: {
          id: 'skill-1',
          name: 'PRD Requirements',
          slug: 'prd-requirements',
          description: 'PRD description',
          objective: 'Define product requirements',
          inputs: [],
          prerequisites: [],
          instructions: 'Draft PRD specs',
          steps: [],
          rules: ['Rule 1', 'Rule 2'],
          expected_output: 'PRD Document',
          visibility: 'public',
          version: 1,
          rating_average: 5.0,
          rating_count: 1,
          usage_count: 10,
          save_count: 5,
          security_scan_status: 'clean',
          security_scanned_at: '2026-01-01T00:00:00Z',
          category: 'Productivity',
          tags: ['PRD'],
          providerCompatibility: ['gemini', 'claude', 'gpt'],
          source: { type: 'official', source_name: 'Veya Core' },
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      },
      {
        id: 'step-2',
        workflow_id: 'wf-test-01',
        skill_id: 'skill-2',
        position: 2,
        enabled: false, // Disabled step should be skipped
        skill: {
          id: 'skill-2',
          name: 'Disabled Skill',
          slug: 'disabled-skill',
          description: 'Disabled description',
          objective: 'Disabled objective',
          inputs: [],
          prerequisites: [],
          instructions: 'Do not execute',
          steps: [],
          rules: [],
          expected_output: 'None',
          visibility: 'public',
          version: 1,
          rating_average: 5.0,
          rating_count: 1,
          usage_count: 10,
          save_count: 5,
          security_scan_status: 'clean',
          security_scanned_at: '2026-01-01T00:00:00Z',
          category: 'Productivity',
          tags: ['Disabled'],
          providerCompatibility: ['gemini', 'claude', 'gpt'],
          source: { type: 'official', source_name: 'Veya Core' },
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      },
    ],
  };

  it('transforms workflow into Claude XML format with custom instructions and filters disabled steps', () => {
    const result = ProviderAdapterEngine.adaptWorkflow(mockWorkflow, 'claude');

    expect(result.providerId).toEqual('claude');
    expect(result.formattedPrompt).toContain('<system_instructions>');
    expect(result.formattedPrompt).toContain('<workflow_goal>');
    expect(result.formattedPrompt).toContain(mockWorkflow.goal);
    expect(result.formattedPrompt).toContain('<custom_instructions>');
    expect(result.formattedPrompt).toContain('Focus on performance and memory optimization.');
    expect(result.formattedPrompt).not.toContain('Disabled Skill');
  });

  it('transforms workflow into Gemini System Instruction format', () => {
    const result = ProviderAdapterEngine.adaptWorkflow(mockWorkflow, 'gemini');

    expect(result.providerId).toEqual('gemini');
    expect(result.formattedPrompt).toContain('SYSTEM INSTRUCTION');
    expect(result.formattedPrompt).toContain(mockWorkflow.goal);
    expect(result.formattedPrompt).toContain('Rule 1');
  });

  it('transforms workflow into GPT Markdown role format', () => {
    const result = ProviderAdapterEngine.adaptWorkflow(mockWorkflow, 'gpt');

    expect(result.providerId).toEqual('gpt');
    expect(result.formattedPrompt).toContain('# SYSTEM ROLE: VEYA FULL-STACK AI ENGINE');
    expect(result.formattedPrompt).toContain('## PRIMARY GOAL');
    expect(result.formattedPrompt).toContain(mockWorkflow.goal);
    expect(result.formattedPrompt).toContain('Custom Context:** Focus on performance');
  });

  it('uses default provider fallback if an unsupported provider string is passed', () => {
    const result = ProviderAdapterEngine.adaptWorkflow(mockWorkflow, 'openrouter' as any);

    expect(result.providerId).toEqual('openrouter');
    expect(result.formattedPrompt).toContain('# SYSTEM ROLE');
  });
});
