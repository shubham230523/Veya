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
    provider: ProviderType = DEFAULT_PROVIDER_ID,
    timeoutMs: number = 120000
  ): Promise<OpenRouterResponse> {
    const startTime = Date.now();
    const apiKey = this.getApiKey();
    const providerInfo = PROVIDERS[provider] || PROVIDERS['openrouter'];
    const model = providerInfo.modelIdentifier;

    console.log(`[Veya AI Engine] [Step 1/3] Preparing prompt response request for model: ${model}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`[Veya AI Engine] ⚠️ Request to ${model} exceeded timeout of ${timeoutMs}ms. Aborting fetch...`);
      controller.abort();
    }, timeoutMs);

    try {
      console.log(`[Veya AI Engine] [Step 2/3] Sending POST to OpenRouter API...`);
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://veya.app',
          'X-Title': 'Veya AI Skill Engine',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const networkTime = Date.now() - startTime;
      console.log(`[Veya AI Engine] [Step 3/3] Received HTTP ${response.status} from OpenRouter in ${networkTime}ms.`);

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[Veya AI Engine] ❌ OpenRouter HTTP Error (${response.status}):`, errText);
        throw new Error(`OpenRouter API Error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || 'No response content returned.';

      return {
        content,
        providerUsed: provider,
        model,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const totalTime = Date.now() - startTime;

      if (err.name === 'AbortError') {
        console.error(`[Veya AI Engine] ❌ Request to ${model} timed out after ${totalTime}ms.`);
        throw new Error(`OpenRouter model (${model}) request timed out after ${Math.round(timeoutMs / 1000)}s.`);
      }

      console.error(`[Veya AI Engine] ❌ Error in generatePromptResponse after ${totalTime}ms:`, err.message);
      throw err;
    }
  }

  static async generateStructuredJSON<T = any>(
    systemInstruction: string,
    userPrompt: string,
    provider: ProviderType = DEFAULT_PROVIDER_ID,
    timeoutMs: number = 120000
  ): Promise<T> {
    const startTime = Date.now();
    const apiKey = this.getApiKey();
    const providerInfo = PROVIDERS[provider] || PROVIDERS['openrouter'];
    const model = providerInfo.modelIdentifier;

    console.log(`[Veya AI Engine] [Step 1/4] Preparing structured JSON request using model: ${model}`);

    const fullPrompt = `${systemInstruction}\n\nUSER PROMPT:\n${userPrompt}\n\nCRITICAL: Return ONLY raw valid JSON. Do not include markdown codeblocks or surrounding conversational text.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`[Veya AI Engine] ⚠️ Request to ${model} exceeded timeout of ${timeoutMs}ms. Aborting fetch...`);
      controller.abort();
    }, timeoutMs);

    try {
      console.log(`[Veya AI Engine] [Step 2/4] Sending POST to OpenRouter API...`);
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://veya.app',
          'X-Title': 'Veya AI Skill Engine',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: fullPrompt }],
          temperature: 0.1,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const networkTime = Date.now() - startTime;
      console.log(`[Veya AI Engine] [Step 3/4] Received HTTP ${response.status} from OpenRouter in ${networkTime}ms.`);

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[Veya AI Engine] ❌ OpenRouter HTTP Error (${response.status}):`, errText);
        throw new Error(`OpenRouter Structured API Error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content || '';

      console.log(`[Veya AI Engine] [Step 4/4] Extracting & parsing JSON payload (${rawContent.length} chars)...`);

      // Extract JSON block if enclosed in markdown
      const jsonMatch = rawContent.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      const jsonString = jsonMatch ? jsonMatch[0] : rawContent.trim();

      try {
        const parsed = JSON.parse(jsonString) as T;
        console.log(`[Veya AI Engine] ✅ Successfully generated & parsed structured JSON in ${Date.now() - startTime}ms.`);
        return parsed;
      } catch (parseErr) {
        console.error(`[Veya AI Engine] ❌ Failed to parse LLM JSON response (${rawContent.length} chars):`, rawContent);
        throw new Error('OpenRouter model returned malformed JSON structure.');
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      const totalTime = Date.now() - startTime;

      if (err.name === 'AbortError') {
        console.error(`[Veya AI Engine] ❌ Request to ${model} timed out after ${totalTime}ms.`);
        throw new Error(`OpenRouter model (${model}) request timed out after ${Math.round(timeoutMs / 1000)}s.`);
      }

      console.error(`[Veya AI Engine] ❌ Error in generateStructuredJSON after ${totalTime}ms:`, err.message);
      throw err;
    }
  }
}
