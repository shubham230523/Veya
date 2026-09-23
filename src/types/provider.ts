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

export const DEFAULT_PROVIDER_ID: ProviderType =
  (process.env.EXPO_PUBLIC_AI_PROVIDER as ProviderType) ||
  (process.env.EXPO_PUBLIC_DEFAULT_PROVIDER as ProviderType) ||
  'openrouter';

const configuredModel = process.env.EXPO_PUBLIC_AI_MODEL || process.env.EXPO_PUBLIC_DEFAULT_MODEL;

export const PROVIDERS: Record<ProviderType, ProviderInfo> = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter API',
    vendor: 'OpenRouter',
    modelIdentifier: configuredModel || 'nvidia/nemotron-3.5-lightning:free',
    description: 'Universal gateway to Claude, GPT-4o, Llama 3, DeepSeek, Nemotron, etc.',
    iconName: 'Sparkles',
    accentColor: '#6366F1',
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    vendor: 'Google AI',
    modelIdentifier: process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash',
    description: 'Direct Google GenAI SDK for long context, system instructions, and fast execution.',
    iconName: 'Zap',
    accentColor: '#8E75FF',
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama Local',
    vendor: 'Localhost',
    modelIdentifier: process.env.EXPO_PUBLIC_OLLAMA_MODEL || 'llama3',
    description: 'Local private offline model execution on http://localhost:11434.',
    iconName: 'Cpu',
    accentColor: '#10B981',
  },
  claude: {
    id: 'claude',
    name: 'Claude 3.5 Sonnet',
    vendor: 'Anthropic',
    modelIdentifier: 'anthropic/claude-3.5-sonnet',
    description: 'Optimal for complex coding, architectural reasoning, and structured XML prompts.',
    iconName: 'Sparkles',
    accentColor: '#D97706',
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
