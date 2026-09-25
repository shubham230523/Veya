import { ParsedIntent } from '../../types/workflow';
import { CanonicalSkill } from '../../types/skill';
import { OpenRouterClient } from './openrouterClient';

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
      const nameLower = skill.name.toLowerCase();
      const descLower = skill.description.toLowerCase();
      const objLower = skill.objective.toLowerCase();

      if (promptLower.includes(nameLower)) score += 5;
      if (promptLower.includes(skill.category.toLowerCase())) score += 3;

      skill.tags.forEach((tag) => {
        const tagLower = tag.toLowerCase();
        if (promptLower.includes(tagLower)) score += 3;
      });

      // Domain & Feature Intent Matchers
      if (promptLower.includes('audio') || promptLower.includes('transcrib') || promptLower.includes('voice') || promptLower.includes('speech')) {
        if (skill.tags.some((t) => ['Audio', 'Whisper', 'Speech', 'Transcription'].includes(t))) score += 5;
        if (nameLower.includes('whisper') || nameLower.includes('audio') || descLower.includes('transcrib')) score += 5;
      }

      if (promptLower.includes('note') || promptLower.includes('summar') || promptLower.includes('organiz')) {
        if (skill.tags.some((t) => ['Notes', 'Summarization', 'PRD', 'Productivity'].includes(t))) score += 4;
        if (nameLower.includes('note') || nameLower.includes('prd') || descLower.includes('note')) score += 4;
      }

      if (promptLower.includes('app') || promptLower.includes('mobile')) {
        if (skill.tags.some((t) => ['React Native', 'Expo', 'Mobile', 'Architecture'].includes(t))) score += 3;
        if (nameLower.includes('react native') || nameLower.includes('architecture')) score += 3;
      }

      if (promptLower.includes('ai') || promptLower.includes('gpt') || promptLower.includes('llm')) {
        if (skill.category === 'AI' || skill.tags.includes('AI')) score += 3;
      }

      return { skill, score };
    }
  );

  const topMatchedSkills = matchedSkillScores
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.skill.id);

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

export const parseIntentWithAI = async (
  rawPrompt: string,
  availableSkills: CanonicalSkill[]
): Promise<ParsedIntent> => {
  try {
    const skillCatalogSummary = availableSkills.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      description: s.description,
      tags: s.tags,
    }));

    const systemInstruction = `You are Veya AI Intent Engine.
Analyze the user's natural language goal prompt and select matching Skills from the provided Catalog.

SKILL CATALOG:
${JSON.stringify(skillCatalogSummary, null, 2)}

Return a JSON object with this EXACT schema:
{
  "extractedGoal": "string summarizing the main goal",
  "domain": "string domain category (e.g. Mobile App, SaaS, Creator, AI)",
  "capabilitiesNeeded": ["array", "of", "capability", "strings"],
  "suggestedSkillIds": ["array", "of", "skill", "ids", "from", "catalog"],
  "confidence": number between 0.0 and 1.0
}`;

    const aiParsed = await OpenRouterClient.generateStructuredJSON<ParsedIntent>(
      systemInstruction,
      rawPrompt,
      undefined,
      15000
    );

    return {
      rawPrompt,
      extractedGoal: aiParsed.extractedGoal || rawPrompt,
      domain: aiParsed.domain || 'Software Engineering',
      capabilitiesNeeded: aiParsed.capabilitiesNeeded || ['General Strategy'],
      suggestedSkillIds:
        aiParsed.suggestedSkillIds && aiParsed.suggestedSkillIds.length > 0
          ? aiParsed.suggestedSkillIds
          : availableSkills.slice(0, 4).map((s) => s.id),
      confidence: aiParsed.confidence || 0.95,
    };
  } catch (err: any) {
    console.warn('Live AI Intent Parsing failed, falling back to heuristic matching:', err.message);
    return parseIntentFromPrompt(rawPrompt, availableSkills);
  }
};
