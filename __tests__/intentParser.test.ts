import { parseIntentFromPrompt, parseIntentWithAI } from '../src/core/ai/intentParser';
import { OpenRouterClient } from '../src/core/ai/openrouterClient';
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
    tags: ['React Native', 'App', 'Mobile', 'PRD', 'UX', 'AI'],
    providerCompatibility: ['gemini', 'claude', 'gpt'],
    source: { type: 'official', source_name: 'Veya' },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'skill-saas-02',
    name: 'SaaS Architecture & RLS',
    slug: 'saas-architecture-rls',
    description: 'SaaS architecture and database RLS',
    objective: 'Build SaaS MVP',
    inputs: [],
    prerequisites: [],
    instructions: 'Build SaaS',
    steps: [],
    rules: [],
    expected_output: 'SaaS code',
    visibility: 'public',
    version: 1,
    rating_average: 5,
    rating_count: 1,
    usage_count: 1,
    save_count: 1,
    security_scan_status: 'clean',
    security_scanned_at: '2026-01-01T00:00:00Z',
    category: 'Business',
    tags: ['SaaS', 'Business', 'Stripe', 'Database'],
    providerCompatibility: ['gemini', 'claude', 'gpt'],
    source: { type: 'official', source_name: 'Veya' },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

describe('IntentParser Engine', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('parses AI note-taking app intent accurately', () => {
    const prompt = 'I want to build an AI-powered note-taking app with audio recording';
    const result = parseIntentFromPrompt(prompt, MOCK_SKILLS);

    expect(result.extractedGoal).toEqual(prompt);
    expect(result.domain).toEqual('Mobile App Development');
    expect(result.capabilitiesNeeded).toContain('OpenRouter AI Integration');
    expect(result.capabilitiesNeeded).toContain('Audio Transcription Pipeline');
    expect(result.suggestedSkillIds.length).toBeGreaterThan(0);
  });

  it('parses YouTube creator strategy intent correctly', () => {
    const prompt = 'I want to launch a YouTube channel about tech and coding';
    const result = parseIntentFromPrompt(prompt, MOCK_SKILLS);

    expect(result.domain).toEqual('Creator Strategy');
    expect(result.capabilitiesNeeded).toContain('YouTube Strategy & Scripting');
  });

  it('parses SaaS business intent with Stripe & database RLS capabilities', () => {
    const prompt = 'Build a SaaS business with Stripe payments and database RLS';
    const result = parseIntentFromPrompt(prompt, MOCK_SKILLS);

    expect(result.domain).toEqual('SaaS Business');
    expect(result.capabilitiesNeeded).toContain('SaaS Architecture');
    expect(result.capabilitiesNeeded).toContain('Database RLS');
  });

  it('provides reliable fallback skill recommendations for generic prompts', () => {
    const prompt = 'General task execution';
    const result = parseIntentFromPrompt(prompt, MOCK_SKILLS);

    expect(result.suggestedSkillIds.length).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('parses intent with AI successfully via OpenRouterClient', async () => {
    jest.spyOn(OpenRouterClient, 'generateStructuredJSON').mockResolvedValueOnce({
      extractedGoal: 'Build AI Note App',
      domain: 'Mobile App',
      capabilitiesNeeded: ['React Native', 'Whisper AI'],
      suggestedSkillIds: ['skill-rn-01'],
      confidence: 0.98,
    });

    const result = await parseIntentWithAI('Build AI note app', MOCK_SKILLS);

    expect(result.extractedGoal).toEqual('Build AI Note App');
    expect(result.domain).toEqual('Mobile App');
    expect(result.confidence).toEqual(0.98);
  });

  it('falls back to heuristic parsing when AI intent parsing fails', async () => {
    jest
      .spyOn(OpenRouterClient, 'generateStructuredJSON')
      .mockRejectedValueOnce(new Error('API Timeout'));

    const result = await parseIntentWithAI('I want to build an app', MOCK_SKILLS);

    expect(result.domain).toEqual('Mobile App Development');
    expect(result.suggestedSkillIds.length).toBeGreaterThan(0);
  });
});
