import { formatFullSkillPrompt } from '../src/features/skills/skillFormatter';
import { CanonicalSkill } from '../src/types/skill';

describe('SkillFormatter Engine', () => {
  const mockSkill: CanonicalSkill = {
    id: 'skill-rn-audit',
    name: 'React Native Performance Auditor',
    slug: 'react-native-performance-auditor',
    description: 'Analyzes React Native code for bottlenecks and memory leaks.',
    objective: 'Identify performance bottlenecks and memory leaks in React Native code.',
    inputs: [{ name: 'userContext', description: 'Target code file', required: true }],
    prerequisites: ['Basic React Native knowledge'],
    instructions: '1. Parse code structure.\n2. Inspect rendering patterns.\n3. Check useEffect cleanup functions.',
    steps: [
      { number: 1, title: 'Input Validation' },
      { number: 2, title: 'Code Inspection' },
    ],
    rules: [
      '- Only analyze provided code; do not modify without permission.',
      '• Focus on React Native best practices.',
      'Output must be structured and actionable.',
    ],
    expected_output: 'Structured Markdown report with issues array and performance score.',
    visibility: 'public',
    version: 1,
    rating_average: 5.0,
    rating_count: 1,
    usage_count: 10,
    save_count: 2,
    security_scan_status: 'clean',
    security_scanned_at: '2026-01-01T00:00:00Z',
    category: 'Coding',
    tags: ['Coding', 'React Native', 'Performance'],
    providerCompatibility: ['openrouter', 'gemini', 'claude', 'gpt'],
    source: { type: 'official', source_name: 'Veya Core' },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  it('formats a complete CanonicalSkill into a structured Markdown prompt', () => {
    const formatted = formatFullSkillPrompt(mockSkill);

    expect(formatted).toContain('# React Native Performance Auditor');
    expect(formatted).toContain('## Objective\nIdentify performance bottlenecks');
    expect(formatted).toContain('## Instructions\n1. Parse code structure.');
    expect(formatted).toContain('## Rules\n- Only analyze provided code');
    expect(formatted).toContain('- Focus on React Native best practices.');
    expect(formatted).toContain('- Output must be structured and actionable.');
    expect(formatted).toContain('## Expected Output\nStructured Markdown report');
  });

  it('handles partial skill objects gracefully without throwing errors', () => {
    const partialFormatted = formatFullSkillPrompt({
      name: 'Partial Skill',
      objective: 'Clear objective statement',
    });

    expect(partialFormatted).toContain('# Partial Skill');
    expect(partialFormatted).toContain('## Objective\nClear objective statement');
    expect(partialFormatted).not.toContain('## Instructions');
    expect(partialFormatted).not.toContain('## Rules');
    expect(partialFormatted).not.toContain('## Expected Output');
  });

  it('handles string rules format correctly', () => {
    const formatted = formatFullSkillPrompt({
      name: 'String Rules Skill',
      rules: ['Rule 1', 'Rule 2'],
    });

    expect(formatted).toContain('## Rules\n- Rule 1\n- Rule 2');
  });
});
