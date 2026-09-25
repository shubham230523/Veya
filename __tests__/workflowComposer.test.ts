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
    prerequisites: ['PRD Requirements'],
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
    name: 'Testing & QA Automation',
    slug: 'testing-qa-automation',
    description: 'Unit and E2E test suite',
    objective: 'Automate testing',
    inputs: [],
    prerequisites: [],
    instructions: 'Write test suite',
    steps: [],
    rules: [],
    expected_output: 'Test code',
    visibility: 'public',
    version: 1,
    rating_average: 5,
    rating_count: 1,
    usage_count: 1,
    save_count: 1,
    security_scan_status: 'clean',
    security_scanned_at: '2026-01-01T00:00:00Z',
    category: 'Testing',
    tags: ['Testing', 'QA'],
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
    const intent = {
      rawPrompt: 'Build app and test',
      extractedGoal: 'Build app and test',
      domain: 'Software Engineering',
      capabilitiesNeeded: ['Coding', 'Testing'],
      suggestedSkillIds: ['skill-1', 'skill-2'],
      confidence: 0.95,
    };
    const workflow = WorkflowComposer.composeFromIntent(intent, MOCK_SKILLS);

    expect(workflow.steps.length).toEqual(2);
    const reordered = WorkflowComposer.reorderSteps(workflow.steps, 0, 1);
    expect(reordered[0].position).toEqual(1);
    expect(reordered[1].position).toEqual(2);
    expect(reordered[0].skill_id).toEqual('skill-2');
  });

  it('handles invalid reorder step indices safely without mutating steps array', () => {
    const prompt = 'Build a mobile app';
    const intent = parseIntentFromPrompt(prompt, MOCK_SKILLS);
    const workflow = WorkflowComposer.composeFromIntent(intent, MOCK_SKILLS);

    const outOfBounds = WorkflowComposer.reorderSteps(workflow.steps, -1, 10);
    expect(outOfBounds.length).toEqual(workflow.steps.length);
  });

  it('validates workflow step dependencies and detects missing coding prerequisite for testing steps', () => {
    const testingOnlyStep = [
      {
        id: 'step-1',
        workflow_id: 'wf-1',
        skill_id: 'skill-2',
        position: 1,
        enabled: true,
        skill: MOCK_SKILLS[1], // Testing skill without Coding skill in steps
      },
    ];

    const validation = WorkflowComposer.validateDependencies(testingOnlyStep);
    expect(validation.valid).toBe(false);
    expect(validation.warnings.length).toEqual(1);
    expect(validation.warnings[0]).toContain('Testing step included without prior Coding');
  });
});
