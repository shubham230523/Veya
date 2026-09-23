import { WorkflowComposer } from '../src/core/ai/workflowComposer';
import { parseIntentFromPrompt } from '../src/core/ai/intentParser';
import { SEED_SKILLS } from '../src/core/database/seed';

describe('WorkflowComposer Engine', () => {
  it('composes an ordered workflow from parsed intent', () => {
    const prompt = 'Build a mobile app with AI audio transcription';
    const intent = parseIntentFromPrompt(prompt, SEED_SKILLS);
    const workflow = WorkflowComposer.composeFromIntent(intent, SEED_SKILLS, 'claude');

    expect(workflow.goal).toEqual(prompt);
    expect(workflow.provider_id).toEqual('claude');
    expect(workflow.steps.length).toBeGreaterThan(0);
    expect(workflow.steps[0].position).toEqual(1);
  });

  it('reorders workflow steps correctly', () => {
    const prompt = 'Build a mobile app';
    const intent = parseIntentFromPrompt(prompt, SEED_SKILLS);
    const workflow = WorkflowComposer.composeFromIntent(intent, SEED_SKILLS);

    const reordered = WorkflowComposer.reorderSteps(workflow.steps, 0, 1);
    expect(reordered[0].position).toEqual(1);
    expect(reordered[1].position).toEqual(2);
  });

  it('validates workflow step dependencies', () => {
    const prompt = 'Build an app';
    const intent = parseIntentFromPrompt(prompt, SEED_SKILLS);
    const workflow = WorkflowComposer.composeFromIntent(intent, SEED_SKILLS);

    const validation = WorkflowComposer.validateDependencies(workflow.steps);
    expect(validation.valid).toBe(true);
    expect(validation.warnings.length).toEqual(0);
  });
});
