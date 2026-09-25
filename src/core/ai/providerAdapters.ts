import { Workflow } from '../../types/workflow';
import { ProviderType } from '../../types/skill';
import { PROVIDERS } from '../../types/provider';

export interface GeneratedOutput {
  providerId: ProviderType;
  providerName: string;
  formattedPrompt: string;
  markdownExport: string;
  jsonExport: string;
  generatedAt: string;
}

export class ProviderAdapterEngine {
  static adaptWorkflow(workflow: Workflow, provider: ProviderType): GeneratedOutput {
    const enabledSteps = workflow.steps
      .filter((s) => s.enabled)
      .sort((a, b) => a.position - b.position);

    let formattedPrompt = '';

    switch (provider) {
      case 'claude':
        formattedPrompt = this.formatClaudeXml(workflow, enabledSteps);
        break;
      case 'gemini':
        formattedPrompt = this.formatGeminiSystemInstructions(workflow, enabledSteps);
        break;
      case 'gpt':
      default:
        formattedPrompt = this.formatGptMarkdownRole(workflow, enabledSteps);
        break;
    }

    const providerInfo = PROVIDERS[provider];

    const jsonExport = JSON.stringify(
      {
        workflowName: workflow.name,
        goal: workflow.goal,
        provider: providerInfo.name,
        model: providerInfo.modelIdentifier,
        generatedAt: new Date().toISOString(),
        steps: enabledSteps.map((s) => ({
          position: s.position,
          skillName: s.skill?.name,
          objective: s.skill?.objective,
          customInstructions: s.customInstructions || null,
        })),
        systemPromptPayload: formattedPrompt,
      },
      null,
      2
    );

    return {
      providerId: provider,
      providerName: providerInfo.name,
      formattedPrompt,
      markdownExport: formattedPrompt,
      jsonExport,
      generatedAt: new Date().toISOString(),
    };
  }

  private static formatClaudeXml(workflow: Workflow, steps: any[]): string {
    return `<system_instructions>
You are an expert Senior Full-Stack AI Engineer tasked with building the user's target application from 0 to 100%.

<workflow_goal>
${workflow.goal}
</workflow_goal>

<execution_sequence>
${steps
  .map(
    (step) => `
<step index="${step.position}" skill="${step.skill?.name || 'Custom Step'}">
  <objective>${step.skill?.objective || ''}</objective>
  <custom_instructions>${step.customInstructions || 'None'}</custom_instructions>
  <instructions>
${step.skill?.instructions || ''}
  </instructions>
  <rules>
${(step.skill?.rules || []).map((r: string) => `    - ${r}`).join('\n')}
  </rules>
  <expected_output>${step.skill?.expected_output || ''}</expected_output>
</step>`
  )
  .join('\n')}
</execution_sequence>

<output_directive>
CRITICAL MANDATE FOR 0-TO-100% CODE CREATION:
1. Execute each step sequentially.
2. Produce complete, fully functional 0-to-100% production source code files (TypeScript components, Expo Router screens, state stores, service hooks, and Supabase SQL migrations).
3. Do NOT use placeholders, stubbed comments (e.g. "// implement here"), or truncated code snippets. Write complete, ready-to-run source code.
</output_directive>
</system_instructions>`;
  }

  private static formatGeminiSystemInstructions(workflow: Workflow, steps: any[]): string {
    return `SYSTEM INSTRUCTION / CONTEXT BLOCK:

GOAL: ${workflow.goal}

ROLE & DIRECTIVE:
You are an expert Senior Full-Stack AI Engineer tasked with taking this project from 0 to 100% completion.
Produce complete, runnable production source code files (TypeScript components, hooks, API services, and Supabase SQL migrations) for each step in the pipeline below. Do not use placeholders or truncated code.

WORKFLOW EXECUTION PIPELINE:
${steps
  .map(
    (step) => `
--- STEP ${step.position}: ${step.skill?.name || 'Custom Step'} ---
OBJECTIVE: ${step.skill?.objective || ''}
${step.customInstructions ? `CUSTOM OVERRIDE: ${step.customInstructions}` : ''}

INSTRUCTIONS:
${step.skill?.instructions || ''}

RULES & CONSTRAINTS:
${(step.skill?.rules || []).map((r: string) => `* ${r}`).join('\n')}

EXPECTED DELIVERABLE:
${step.skill?.expected_output || ''}
`
  )
  .join('\n')}

Execute sequentially according to Gemini multimodal and structured reasoning guidelines. Output complete production source code files from 0 to 100%.`;
  }

  private static formatGptMarkdownRole(workflow: Workflow, steps: any[]): string {
    return `# SYSTEM ROLE: VEYA FULL-STACK AI ENGINE

## PRIMARY GOAL
${workflow.goal}

## MANDATE FOR 0-TO-100% APP CREATION
You are acting as the primary lead AI engineer building this application from scratch (0 to 100%).
For each step below, output complete, compilable, production-ready source code files (Expo Router screens, components, services, and database migrations). Do not truncate code or use "// write code here" placeholders.

## WORKFLOW STEPS

${steps
  .map(
    (step) => `### Step ${step.position}: ${step.skill?.name || 'Custom Step'}
**Objective:** ${step.skill?.objective || ''}
${step.customInstructions ? `**Custom Context:** ${step.customInstructions}` : ''}

**Instructions:**
${step.skill?.instructions || ''}

**Rules:**
${(step.skill?.rules || []).map((r: string) => `- ${r}`).join('\n')}

**Expected Output:**
${step.skill?.expected_output || ''}
`
  )
  .join('\n\n')}

---
*Generated by Veya Universal AI Skill Engine for GPT-4o*`;
  }
}
