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

  private static getModelIdentifier(provider: ProviderType = DEFAULT_PROVIDER_ID): string {
    const envModel =
      process.env.EXPO_PUBLIC_AI_MODEL ||
      process.env.EXPO_PUBLIC_DEFAULT_MODEL ||
      process.env.EXPO_PUBLIC_OPENROUTER_MODEL;

    if (envModel && envModel.trim()) {
      return envModel.trim();
    }

    const providerInfo = PROVIDERS[provider] || PROVIDERS['openrouter'];
    return providerInfo.modelIdentifier;
  }

  static async generatePromptResponseStream(
    prompt: string,
    onChunk: (chunk: string, accumulated: string) => void,
    provider: ProviderType = DEFAULT_PROVIDER_ID,
    timeoutMs: number = 120000
  ): Promise<OpenRouterResponse> {
    const startTime = Date.now();
    const apiKey = this.getApiKey();
    const model = this.getModelIdentifier(provider);

    console.log(`[Veya AI Engine Stream] ⚡ Requesting stream from model: ${model}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`[Veya AI Engine Stream] ⚠️ Request to ${model} exceeded timeout of ${timeoutMs}ms.`);
      controller.abort();
    }, timeoutMs);

    try {
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
          stream: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[Veya AI Engine Stream] ❌ OpenRouter HTTP Error (${response.status}):`, errText);
        throw new Error(`OpenRouter Streaming API Error (${response.status}): ${errText}`);
      }

      let accumulated = '';

      if (response.body && typeof response.body.getReader === 'function') {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;
        let buffer = '';

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;

          if (value) {
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const cleanLine = line.trim();
              if (!cleanLine || cleanLine.startsWith(':')) continue;
              if (cleanLine === 'data: [DONE]') break;

              if (cleanLine.startsWith('data: ')) {
                try {
                  const jsonStr = cleanLine.slice(6);
                  const parsed = JSON.parse(jsonStr);
                  const token = parsed.choices?.[0]?.delta?.content || '';
                  if (token) {
                    accumulated += token;
                    onChunk(token, accumulated);
                  }
                } catch (_) {
                  // ignore partial JSON SSE fragments
                }
              }
            }
          }
        }
      } else {
        const data = await response.json();
        accumulated = data.choices?.[0]?.message?.content || '';
        onChunk(accumulated, accumulated);
      }

      console.log(`[Veya AI Engine Stream] ✅ Stream completed in ${Date.now() - startTime}ms (${accumulated.length} chars).`);

      return {
        content: accumulated,
        providerUsed: provider,
        model,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`OpenRouter model (${model}) request timed out after ${Math.round(timeoutMs / 1000)}s.`);
      }
      throw err;
    }
  }

  static async generateStructuredJSONStream<T = any>(
    systemInstruction: string,
    userPrompt: string,
    onChunk: (chunkText: string, accumulated: string) => void,
    provider: ProviderType = DEFAULT_PROVIDER_ID,
    timeoutMs: number = 60000
  ): Promise<T> {
    const fullPrompt = `${systemInstruction}\n\nUSER PROMPT:\n${userPrompt}\n\nCRITICAL: Return ONLY raw valid JSON. Do not include markdown codeblocks or surrounding conversational text.`;

    const res = await this.generatePromptResponseStream(
      fullPrompt,
      onChunk,
      provider,
      timeoutMs
    );

    return cleanAndParseJSON<T>(res.content);
  }

  static async generatePromptResponse(
    prompt: string,
    provider: ProviderType = DEFAULT_PROVIDER_ID,
    timeoutMs: number = 120000
  ): Promise<OpenRouterResponse> {
    const startTime = Date.now();
    const apiKey = this.getApiKey();
    const model = this.getModelIdentifier(provider);

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
    timeoutMs: number = 60000
  ): Promise<T> {
    const startTime = Date.now();
    const apiKey = this.getApiKey();
    const model = this.getModelIdentifier(provider);

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

      try {
        const parsed = cleanAndParseJSON<T>(rawContent);
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

export function cleanAndParseJSON<T>(rawContent: string): T {
  if (!rawContent || !rawContent.trim()) {
    throw new Error('OpenRouter model returned empty response content.');
  }

  const trimmed = rawContent.trim();

  // 1. Direct JSON parse
  try {
    return JSON.parse(trimmed) as T;
  } catch (_) {}

  // 2. Extract inner content from ```json ... ``` or ``` ... ```
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    const innerContent = codeBlockMatch[1].trim();
    try {
      return JSON.parse(innerContent) as T;
    } catch (_) {}

    try {
      return JSON.parse(sanitizeJsonString(innerContent)) as T;
    } catch (_) {}
  }

  // 3. Find outer boundaries of first '{' ... '}' or '[' ... ']'
  const firstCurly = trimmed.indexOf('{');
  const firstSquare = trimmed.indexOf('[');

  let jsonCandidate = '';

  if (firstCurly !== -1 && (firstSquare === -1 || firstCurly < firstSquare)) {
    const lastCurly = trimmed.lastIndexOf('}');
    if (lastCurly > firstCurly) {
      jsonCandidate = trimmed.slice(firstCurly, lastCurly + 1);
    }
  } else if (firstSquare !== -1) {
    const lastSquare = trimmed.lastIndexOf(']');
    if (lastSquare > firstSquare) {
      jsonCandidate = trimmed.slice(firstSquare, lastSquare + 1);
    }
  }

  if (jsonCandidate) {
    try {
      return JSON.parse(jsonCandidate) as T;
    } catch (_) {}

    try {
      return JSON.parse(sanitizeJsonString(jsonCandidate)) as T;
    } catch (_) {}
  }

  // 4. Sanitize whole trimmed text
  try {
    return JSON.parse(sanitizeJsonString(trimmed)) as T;
  } catch (_) {}

  throw new Error('OpenRouter model returned malformed JSON structure.');
}

function sanitizeJsonString(str: string): string {
  return str
    .replace(/\/\/.*/g, '')
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/[\x00-\x1F\x7F-\x9F]/g, (ch) => {
      if (ch === '\n' || ch === '\r' || ch === '\t') return ch;
      return '';
    });
}
