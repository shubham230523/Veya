import { Workflow, WorkflowStep, ParsedIntent } from '../../types/workflow';
import { CanonicalSkill, ProviderType } from '../../types/skill';

export const COMPONENT_ORDER_PRIORITY: Record<string, number> = {
  Productivity: 1, // Requirements / PRD / Specs
  Research: 2, // Competitor & Market Research
  Design: 3, // UX / Wireframes / UI Layout
  Business: 4, // SaaS Strategy & Monetization
  Coding: 5, // Architecture & Code Development
  AI: 6, // AI Integration & Feature Logic
  Creator: 7,
  Testing: 8, // Test Suite & Quality Audit
  Deployment: 9, // Build & Deployment Pipeline
};

export class WorkflowComposer {
  static composeFromResearchedSkills(
    ideaPrompt: string,
    skills: CanonicalSkill[],
    provider: ProviderType = 'claude'
  ): Workflow {
    // Sort skills logically by component order priority
    const orderedSkills = [...skills].sort((a, b) => {
      const priorityA = COMPONENT_ORDER_PRIORITY[a.category] || 99;
      const priorityB = COMPONENT_ORDER_PRIORITY[b.category] || 99;
      return priorityA - priorityB;
    });

    const workflowId = `wf-${Date.now()}`;

    const steps: WorkflowStep[] = orderedSkills.map((skill, index) => ({
      id: `step-${index + 1}`,
      workflow_id: workflowId,
      skill_id: skill.id,
      position: index + 1,
      enabled: true,
      skill,
    }));

    return {
      id: workflowId,
      user_id: 'user-current',
      name: `Workflow: ${ideaPrompt.slice(0, 35)}...`,
      description: `AI Researched Workflow for: "${ideaPrompt}"`,
      goal: ideaPrompt,
      provider_id: provider,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      steps,
    };
  }

  static composeFromIntent(
    intent: ParsedIntent,
    availableSkills: CanonicalSkill[],
    provider: ProviderType = 'claude'
  ): Workflow {
    const selectedSkills = intent.suggestedSkillIds
      .map((id) => availableSkills.find((s) => s.id === id))
      .filter((s): s is CanonicalSkill => s !== undefined);

    // Sort skills logically by component order priority
    const orderedSkills = [...selectedSkills].sort((a, b) => {
      const priorityA = COMPONENT_ORDER_PRIORITY[a.category] || 99;
      const priorityB = COMPONENT_ORDER_PRIORITY[b.category] || 99;
      return priorityA - priorityB;
    });

    const workflowId = `wf-${Date.now()}`;

    const steps: WorkflowStep[] = orderedSkills.map((skill, index) => ({
      id: `step-${index + 1}`,
      workflow_id: workflowId,
      skill_id: skill.id,
      position: index + 1,
      enabled: true,
      skill,
    }));

    return {
      id: workflowId,
      user_id: 'user-current',
      name: `Workflow: ${intent.extractedGoal.slice(0, 30)}...`,
      description: `Generated workflow based on goal: "${intent.extractedGoal}"`,
      goal: intent.extractedGoal,
      provider_id: provider,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      steps,
    };
  }

  static reorderSteps(steps: WorkflowStep[], fromIndex: number, toIndex: number): WorkflowStep[] {
    const result = [...steps];
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);

    // Re-assign positions 1..N
    return result.map((step, idx) => ({
      ...step,
      position: idx + 1,
    }));
  }

  static validateDependencies(steps: WorkflowStep[]): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    const enabledSteps = steps.filter((s) => s.enabled && s.skill);

    const hasTesting = enabledSteps.some((s) => s.skill?.category === 'Testing');
    const hasCoding = enabledSteps.some((s) => s.skill?.category === 'Coding');

    if (hasTesting && !hasCoding) {
      warnings.push('Testing step included without prior Coding/Architecture implementation step.');
    }

    return {
      valid: warnings.length === 0,
      warnings,
    };
  }
}
