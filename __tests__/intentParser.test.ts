import { parseIntentFromPrompt } from '../src/core/ai/intentParser';
import { CanonicalSkill } from '../src/types/skill';

const MOCK_SKILLS: CanonicalSkill[] = [
  {
    id: 'skill-rn-01',
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
];

describe('IntentParser Engine', () => {
  it('parses AI note-taking app intent accurately', () => {
    const prompt = 'I want to build an AI-powered note-taking app with audio recording';
    const result = parseIntentFromPrompt(prompt, MOCK_SKILLS);

    expect(result.extractedGoal).toEqual(prompt);
    expect(result.domain).toEqual('Mobile App Development');
    expect(result.capabilitiesNeeded).toContain('OpenRouter AI Integration');
    expect(result.suggestedSkillIds.length).toBeGreaterThan(0);
  });

  it('parses YouTube creator strategy intent correctly', () => {
    const prompt = 'I want to launch a YouTube channel about tech and coding';
    const result = parseIntentFromPrompt(prompt, MOCK_SKILLS);

    expect(result.domain).toEqual('Creator Strategy');
    expect(result.capabilitiesNeeded).toContain('YouTube Strategy & Scripting');
  });

  it('provides reliable fallback skill recommendations for generic prompts', () => {
    const prompt = 'General task execution';
    const result = parseIntentFromPrompt(prompt, MOCK_SKILLS);

    expect(result.suggestedSkillIds.length).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
  });
});
