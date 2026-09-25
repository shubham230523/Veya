import { CanonicalSkill } from '../../types/skill';

/**
 * Formats a CanonicalSkill into a clean, complete Markdown prompt
 * ready to copy-paste into AI coding tools like Antigravity, Cursor, ChatGPT, Claude, etc.
 */
export function formatFullSkillPrompt(skill: Partial<CanonicalSkill>): string {
  const parts: string[] = [];

  if (skill.name) {
    parts.push(`# ${skill.name}`);
  }

  if (skill.objective) {
    parts.push(`## Objective\n${skill.objective}`);
  }

  if (skill.instructions) {
    parts.push(`## Instructions\n${skill.instructions}`);
  }

  if (skill.rules && skill.rules.length > 0) {
    const rulesList = Array.isArray(skill.rules)
      ? skill.rules.map((r) => `- ${r.replace(/^[-*•]\s*/, '')}`).join('\n')
      : String(skill.rules);
    parts.push(`## Rules\n${rulesList}`);
  }

  if (skill.expected_output) {
    parts.push(`## Expected Output\n${skill.expected_output}`);
  }

  return parts.join('\n\n');
}
