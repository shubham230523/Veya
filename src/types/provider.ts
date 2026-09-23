import { ProviderType } from './skill';

export interface ProviderInfo {
  id: ProviderType;
  name: string;
  vendor: string;
  modelIdentifier: string;
  description: string;
  iconName: string;
  accentColor: string;
}

export const PROVIDERS: Record<ProviderType, ProviderInfo> = {
  claude: {
    id: 'claude',
    name: 'Claude 3.5 Sonnet',
    vendor: 'Anthropic',
    modelIdentifier: 'anthropic/claude-3.5-sonnet',
    description: 'Optimal for complex coding, architectural reasoning, and structured XML prompts.',
    iconName: 'Sparkles',
    accentColor: '#D97706',
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini 1.5 Pro',
    vendor: 'Google',
    modelIdentifier: 'google/gemini-pro-1.5',
    description: 'Ultra-long context window, excellent multi-modal and system instruction support.',
    iconName: 'Zap',
    accentColor: '#8E75FF',
  },
  gpt: {
    id: 'gpt',
    name: 'GPT-4o',
    vendor: 'OpenAI',
    modelIdentifier: 'openai/gpt-4o',
    description: 'Fast, highly reliable instruction-following with crisp Markdown output formatting.',
    iconName: 'Cpu',
    accentColor: '#10A37F',
  },
};
