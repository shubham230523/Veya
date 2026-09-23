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
          rules: ['Rule 1'],
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
    ],
  };

  it('transforms workflow into Claude XML format', () => {
    const result = ProviderAdapterEngine.adaptWorkflow(mockWorkflow, 'claude');

    expect(result.providerId).toEqual('claude');
    expect(result.formattedPrompt).toContain('<system_instructions>');
    expect(result.formattedPrompt).toContain('<workflow_goal>');
    expect(result.formattedPrompt).toContain(mockWorkflow.goal);
    expect(result.formattedPrompt).toContain('</system_instructions>');
  });

  it('transforms workflow into Gemini System Instruction format', () => {
    const result = ProviderAdapterEngine.adaptWorkflow(mockWorkflow, 'gemini');

    expect(result.providerId).toEqual('gemini');
    expect(result.formattedPrompt).toContain('SYSTEM INSTRUCTION');
    expect(result.formattedPrompt).toContain(mockWorkflow.goal);
  });

  it('transforms workflow into GPT Markdown role format', () => {
    const result = ProviderAdapterEngine.adaptWorkflow(mockWorkflow, 'gpt');

    expect(result.providerId).toEqual('gpt');
    expect(result.formattedPrompt).toContain('# SYSTEM ROLE: VEYA WORKFLOW ENGINE');
    expect(result.formattedPrompt).toContain('## PRIMARY GOAL');
    expect(result.formattedPrompt).toContain(mockWorkflow.goal);
  });
});
