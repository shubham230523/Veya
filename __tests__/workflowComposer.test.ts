import { WorkflowComposer } from '../src/core/ai/workflowComposer';
import { parseIntentFromPrompt } from '../src/core/ai/intentParser';
import { CanonicalSkill } from '../src/types/skill';

const MOCK_SKILLS: CanonicalSkill[] = [
  {
    id: 'skill-1',
    name: 'React Native Architecture',
    slug: 'react-native-architecture',
    description: 'React native app architecture',
    objective: 'Build mobile app',
    inputs: [],
    prerequisites: [],
    instructions: 'Build app',
    steps: [],
    rules: [],
    expected_output: 'App code',
    visibility: 'public',
    version: 1,
    rating_average: 5,
    rating_count: 1,
    usage_count: 1,
    save_count: 1,
    security_scan_status: 'clean',
    security_scanned_at: '2026-01-01T00:00:00Z',
    category: 'Coding',
    tags: ['React Native', 'App', 'Mobile'],
    providerCompatibility: ['gemini', 'claude', 'gpt'],
    source: { type: 'official', source_name: 'Veya' },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'skill-2',
    name: 'Mobile UX Architecture',
    slug: 'mobile-ux-architecture',
    description: 'UX wireframe architecture',
    objective: 'Design UX',
    inputs: [],
    prerequisites: [],
    instructions: 'Design UX',
    steps: [],
    rules: [],
    expected_output: 'UX Spec',
    visibility: 'public',
    version: 1,
    rating_average: 5,
    rating_count: 1,
    usage_count: 1,
    save_count: 1,
    security_scan_status: 'clean',
    security_scanned_at: '2026-01-01T00:00:00Z',
    category: 'Design',
    tags: ['UX', 'Design'],
    providerCompatibility: ['gemini', 'claude', 'gpt'],
    source: { type: 'official', source_name: 'Veya' },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

describe('WorkflowComposer Engine', () => {
  it('composes an ordered workflow from parsed intent', () => {
    const prompt = 'Build a mobile app with AI audio transcription';
    const intent = parseIntentFromPrompt(prompt, MOCK_SKILLS);
    const workflow = WorkflowComposer.composeFromIntent(intent, MOCK_SKILLS, 'claude');

    expect(workflow.goal).toEqual(prompt);
    expect(workflow.provider_id).toEqual('claude');
    expect(workflow.steps.length).toBeGreaterThan(0);
    expect(workflow.steps[0].position).toEqual(1);
  });

  it('reorders workflow steps correctly', () => {
    const prompt = 'Build a mobile app';
    const intent = parseIntentFromPrompt(prompt, MOCK_SKILLS);
    const workflow = WorkflowComposer.composeFromIntent(intent, MOCK_SKILLS);

    const reordered = WorkflowComposer.reorderSteps(workflow.steps, 0, 1);
    expect(reordered[0].position).toEqual(1);
    expect(reordered[1].position).toEqual(2);
  });

  it('validates workflow step dependencies', () => {
    const prompt = 'Build an app';
    const intent = parseIntentFromPrompt(prompt, MOCK_SKILLS);
    const workflow = WorkflowComposer.composeFromIntent(intent, MOCK_SKILLS);

    const validation = WorkflowComposer.validateDependencies(workflow.steps);
    expect(validation.valid).toBe(true);
    expect(validation.warnings.length).toEqual(0);
  });
});
