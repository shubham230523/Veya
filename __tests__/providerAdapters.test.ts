import { ProviderAdapterEngine } from '../src/core/ai/providerAdapters';
import { SEED_WORKFLOWS } from '../src/core/database/seed';

describe('ProviderAdapters Engine', () => {
  const workflow = SEED_WORKFLOWS[0]; // Demo AI Note-Taking workflow

  it('transforms workflow into Claude XML format', () => {
    const result = ProviderAdapterEngine.adaptWorkflow(workflow, 'claude');

    expect(result.providerId).toEqual('claude');
    expect(result.formattedPrompt).toContain('<system_instructions>');
    expect(result.formattedPrompt).toContain('<workflow_goal>');
    expect(result.formattedPrompt).toContain(workflow.goal);
    expect(result.formattedPrompt).toContain('</system_instructions>');
  });

  it('transforms workflow into Gemini System Instruction format', () => {
    const result = ProviderAdapterEngine.adaptWorkflow(workflow, 'gemini');

    expect(result.providerId).toEqual('gemini');
    expect(result.formattedPrompt).toContain('SYSTEM INSTRUCTION');
    expect(result.formattedPrompt).toContain(workflow.goal);
  });

  it('transforms workflow into GPT Markdown role format', () => {
    const result = ProviderAdapterEngine.adaptWorkflow(workflow, 'gpt');

    expect(result.providerId).toEqual('gpt');
    expect(result.formattedPrompt).toContain('# SYSTEM ROLE: VEYA WORKFLOW ENGINE');
    expect(result.formattedPrompt).toContain('## PRIMARY GOAL');
    expect(result.formattedPrompt).toContain(workflow.goal);
  });
});
