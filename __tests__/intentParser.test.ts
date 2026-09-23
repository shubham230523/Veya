import { parseIntentFromPrompt } from '../src/core/ai/intentParser';
import { SEED_SKILLS } from '../src/core/database/seed';

describe('IntentParser Engine', () => {
  it('parses AI note-taking app intent accurately', () => {
    const prompt = 'I want to build an AI-powered note-taking app with audio recording';
    const result = parseIntentFromPrompt(prompt, SEED_SKILLS);

    expect(result.extractedGoal).toEqual(prompt);
    expect(result.domain).toEqual('Mobile App Development');
    expect(result.capabilitiesNeeded).toContain('OpenRouter AI Integration');
    expect(result.suggestedSkillIds.length).toBeGreaterThan(0);
  });

  it('parses YouTube creator strategy intent correctly', () => {
    const prompt = 'I want to launch a YouTube channel about tech and coding';
    const result = parseIntentFromPrompt(prompt, SEED_SKILLS);

    expect(result.domain).toEqual('Creator Strategy');
    expect(result.capabilitiesNeeded).toContain('YouTube Strategy & Scripting');
  });

  it('provides reliable fallback skill recommendations for generic prompts', () => {
    const prompt = 'General task execution';
    const result = parseIntentFromPrompt(prompt, SEED_SKILLS);

    expect(result.suggestedSkillIds.length).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
  });
});
