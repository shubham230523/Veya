import { CanonicalSkill, ProviderType } from './skill';

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  skill_id: string;
  position: number;
  custom_instructions?: string;
  customInstructions?: string;
  enabled: boolean;
  skill?: CanonicalSkill;
}

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  goal: string;
  provider_id: ProviderType;
  created_at: string;
  updated_at: string;
  steps: WorkflowStep[];
}

export interface ParsedIntent {
  rawPrompt: string;
  extractedGoal: string;
  domain: string;
  capabilitiesNeeded: string[];
  suggestedSkillIds: string[];
  confidence: number;
}
