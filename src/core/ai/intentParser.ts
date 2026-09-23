import { ParsedIntent } from '../../types/workflow';
import { CanonicalSkill } from '../../types/skill';

export const parseIntentFromPrompt = (
  rawPrompt: string,
  availableSkills: CanonicalSkill[]
): ParsedIntent => {
  const promptLower = rawPrompt.toLowerCase().trim();

  const capabilitiesNeeded: string[] = [];
  let domain = 'Software Engineering';

  // Keyword / Capability Identification
  if (promptLower.includes('note') || promptLower.includes('app') || promptLower.includes('mobile')) {
    domain = 'Mobile App Development';
    capabilitiesNeeded.push('PRD Requirements', 'Mobile UX', 'React Native Architecture');
  }

  if (promptLower.includes('ai') || promptLower.includes('summar') || promptLower.includes('gpt') || promptLower.includes('llm')) {
    capabilitiesNeeded.push('OpenRouter AI Integration', 'Prompt Injection Security');
  }

  if (promptLower.includes('voice') || promptLower.includes('audio') || promptLower.includes('record') || promptLower.includes('speech')) {
    capabilitiesNeeded.push('Audio Transcription Pipeline');
  }

  if (promptLower.includes('youtube') || promptLower.includes('video') || promptLower.includes('channel')) {
    domain = 'Creator Strategy';
    capabilitiesNeeded.push('YouTube Strategy & Scripting');
  }

  if (promptLower.includes('saas') || promptLower.includes('business') || promptLower.includes('stripe')) {
    domain = 'SaaS Business';
    capabilitiesNeeded.push('SaaS Architecture', 'Database RLS');
  }

  // Skill Matching Algorithm based on keyword relevance & tags
  const matchedSkillScores: { skill: CanonicalSkill; score: number }[] = availableSkills.map(
    (skill) => {
      let score = 0;

      // Title/Description match
      if (promptLower.includes(skill.name.toLowerCase())) score += 5;
      if (promptLower.includes(skill.category.toLowerCase())) score += 3;

      // Tag matches
      skill.tags.forEach((tag) => {
        if (promptLower.includes(tag.toLowerCase())) score += 2;
      });

      // Broad intent match triggers
      if (promptLower.includes('app') && ['PRD', 'UX', 'React Native'].some((k) => skill.tags.includes(k))) score += 2;
      if (promptLower.includes('ai') && ['AI', 'OpenRouter', 'Whisper'].some((k) => skill.tags.includes(k))) score += 2;

      return { skill, score };
    }
  );

  // Filter and sort skills by score
  const topMatchedSkills = matchedSkillScores
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.skill.id);

  // Fallback: Default to foundational pipeline if no specific match
  const suggestedSkillIds =
    topMatchedSkills.length > 0
      ? topMatchedSkills.slice(0, 6)
      : availableSkills.slice(0, 4).map((s) => s.id);

  return {
    rawPrompt,
    extractedGoal: rawPrompt,
    domain,
    capabilitiesNeeded: capabilitiesNeeded.length > 0 ? capabilitiesNeeded : ['General Execution Strategy'],
    suggestedSkillIds,
    confidence: topMatchedSkills.length > 0 ? 0.92 : 0.75,
  };
};
