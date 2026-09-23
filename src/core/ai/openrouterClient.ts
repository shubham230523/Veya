import { ProviderType } from '../../types/skill';
import { PROVIDERS, DEFAULT_PROVIDER_ID } from '../../types/provider';

export interface OpenRouterResponse {
  content: string;
  providerUsed: ProviderType;
  model: string;
}

export class OpenRouterClient {
  private static getApiKey(): string {
    const key = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';
    if (!key || key.includes('placeholder')) {
      throw new Error(
        'OpenRouter API key is missing. Please set EXPO_PUBLIC_OPENROUTER_API_KEY in your .env file.'
      );
    }
    return key.trim();
  }

  static async generatePromptResponse(
    prompt: string,
    provider: ProviderType = DEFAULT_PROVIDER_ID
  ): Promise<OpenRouterResponse> {
    const apiKey = this.getApiKey();
    const providerInfo = PROVIDERS[provider] || PROVIDERS['openrouter'];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://veya.app',
        'X-Title': 'Veya AI Skill Engine',
      },
      body: JSON.stringify({
        model: providerInfo.modelIdentifier,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'No response content returned.';

    return {
      content,
      providerUsed: provider,
      model: providerInfo.modelIdentifier,
    };
  }

  static async generateStructuredJSON<T = any>(
    systemInstruction: string,
    userPrompt: string,
    provider: ProviderType = DEFAULT_PROVIDER_ID
  ): Promise<T> {
    const apiKey = this.getApiKey();
    const providerInfo = PROVIDERS[provider] || PROVIDERS['openrouter'];

    const fullPrompt = `${systemInstruction}\n\nUSER PROMPT:\n${userPrompt}\n\nCRITICAL: Return ONLY raw valid JSON. Do not include markdown codeblocks or surrounding conversational text.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://veya.app',
        'X-Title': 'Veya AI Skill Engine',
      },
      body: JSON.stringify({
        model: providerInfo.modelIdentifier,
        messages: [{ role: 'user', content: fullPrompt }],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter Structured API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '';

    // Extract JSON block if enclosed in markdown
    const jsonMatch = rawContent.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    const jsonString = jsonMatch ? jsonMatch[0] : rawContent.trim();

    try {
      return JSON.parse(jsonString) as T;
    } catch (parseErr) {
      console.error('Failed to parse LLM JSON response:', rawContent);
      throw new Error('OpenRouter model returned malformed JSON structure.');
    }
  }
}
