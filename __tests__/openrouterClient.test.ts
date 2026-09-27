import { OpenRouterClient, cleanAndParseJSON } from '../src/core/ai/openrouterClient';

describe('OpenRouter AI Client', () => {

  beforeEach(() => {
    jest.restoreAllMocks();
    delete process.env.EXPO_PUBLIC_AI_MODEL;
    delete process.env.EXPO_PUBLIC_DEFAULT_MODEL;
    delete process.env.EXPO_PUBLIC_OPENROUTER_MODEL;
    process.env.EXPO_PUBLIC_OPENROUTER_API_KEY = 'sk-or-v1-test-key-mock';
  });

  describe('API Key and Model Configuration', () => {
    it('throws error when API key is missing or placeholder', async () => {
      delete process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
      await expect(OpenRouterClient.generatePromptResponse('Hello')).rejects.toThrow(
        'OpenRouter API key is missing'
      );

      process.env.EXPO_PUBLIC_OPENROUTER_API_KEY = 'placeholder-key';
      await expect(OpenRouterClient.generatePromptResponse('Hello')).rejects.toThrow(
        'OpenRouter API key is missing'
      );
    });

    it('respects EXPO_PUBLIC_AI_MODEL, EXPO_PUBLIC_DEFAULT_MODEL, and EXPO_PUBLIC_OPENROUTER_MODEL env variables', async () => {
      process.env.EXPO_PUBLIC_AI_MODEL = 'custom/test-model';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response' } }],
        }),
      });

      const res1 = await OpenRouterClient.generatePromptResponse('Prompt');
      expect(res1.model).toBe('custom/test-model');

      delete process.env.EXPO_PUBLIC_AI_MODEL;
      process.env.EXPO_PUBLIC_DEFAULT_MODEL = 'custom/default-model';

      const res2 = await OpenRouterClient.generatePromptResponse('Prompt');
      expect(res2.model).toBe('custom/default-model');

      delete process.env.EXPO_PUBLIC_DEFAULT_MODEL;
      process.env.EXPO_PUBLIC_OPENROUTER_MODEL = 'custom/openrouter-model';

      const res3 = await OpenRouterClient.generatePromptResponse('Prompt');
      expect(res3.model).toBe('custom/openrouter-model');
    });

    it('falls back to PROVIDERS modelIdentifier when no env override is present', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response' } }],
        }),
      });

      const res = await OpenRouterClient.generatePromptResponse('Prompt', 'gemini');
      expect(res.model).toContain('gemini');
    });
  });

  describe('generatePromptResponse()', () => {
    it('sends prompt to OpenRouter API and parses completion response', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce({
          choices: [{ message: { content: 'Mocked AI Response' } }],
        }),
      });

      const res = await OpenRouterClient.generatePromptResponse('What is AI?');

      expect(res.content).toEqual('Mocked AI Response');
      expect(res.providerUsed).toEqual('openrouter');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('returns default fallback message when choices array is empty', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce({ choices: [] }),
      });

      const res = await OpenRouterClient.generatePromptResponse('Prompt');
      expect(res.content).toBe('No response content returned.');
    });

    it('handles non-200 HTTP error status codes', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: jest.fn().mockResolvedValueOnce('Unauthorized API Key'),
      });

      await expect(OpenRouterClient.generatePromptResponse('Test Prompt')).rejects.toThrow(
        'OpenRouter API Error (401)'
      );
    });

    it('handles timeout AbortError gracefully', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      global.fetch = jest.fn().mockRejectedValueOnce(abortError);

      await expect(
        OpenRouterClient.generatePromptResponse('Test Prompt', 'openrouter', 10)
      ).rejects.toThrow('request timed out after 0s');
    });
  });

  describe('generateStructuredJSON() and Streaming', () => {
    it('parses structured JSON responses from LLM completion', async () => {
      const mockPayload = { status: 'success', data: [1, 2, 3] };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify(mockPayload) } }],
        }),
      });

      const res = await OpenRouterClient.generateStructuredJSON('System Spec', 'User Prompt');
      expect(res).toEqual(mockPayload);
    });

    it('handles HTTP error responses in generateStructuredJSON', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValueOnce('Internal Server Error'),
      });

      await expect(
        OpenRouterClient.generateStructuredJSON('System Spec', 'User Prompt')
      ).rejects.toThrow('OpenRouter Structured API Error (500)');
    });

    it('handles AbortError in generateStructuredJSON', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';

      global.fetch = jest.fn().mockRejectedValueOnce(abortError);

      await expect(
        OpenRouterClient.generateStructuredJSON('System Spec', 'User Prompt', 'openrouter', 10)
      ).rejects.toThrow('request timed out');
    });

    it('streams structured JSON with onChunk progress callback', async () => {
      const mockPayload = { result: 'Streamed Object' };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify(mockPayload) } }],
        }),
      });

      const onChunkMock = jest.fn();

      const res = await OpenRouterClient.generateStructuredJSONStream(
        'System Spec',
        'User Prompt',
        onChunkMock
      );

      expect(res).toEqual(mockPayload);
      expect(onChunkMock).toHaveBeenCalled();
    });

    it('streams structured JSON without onChunk callback and with web ReadableStream reader', async () => {
      const mockPayload = { status: 'streamed' };

      const encoder = new TextEncoder();
      const chunk1 = 'data: {"choices":[{"delta":{"content":"{\\"status\\":\\"streamed\\"}"}}]}\n\n';
      const chunk2 = 'data: [DONE]\n\n';

      let readCount = 0;
      const mockReader = {
        read: jest.fn().mockImplementation(() => {
          readCount++;
          if (readCount === 1) {
            return Promise.resolve({ done: false, value: encoder.encode(chunk1) });
          }
          if (readCount === 2) {
            return Promise.resolve({ done: false, value: encoder.encode(chunk2) });
          }
          return Promise.resolve({ done: true, value: undefined });
        }),
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      });

      const res = await OpenRouterClient.generateStructuredJSONStream(
        'System Spec',
        'User Prompt'
      );

      expect(res).toEqual(mockPayload);
    });

    it('handles HTTP error in generatePromptResponseStream', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: jest.fn().mockResolvedValueOnce('Forbidden'),
      });

      await expect(
        OpenRouterClient.generatePromptResponseStream('Prompt', jest.fn())
      ).rejects.toThrow('OpenRouter Streaming API Error (403)');
    });
  });

  describe('cleanAndParseJSON()', () => {
    it('throws error for empty raw content', () => {
      expect(() => cleanAndParseJSON('')).toThrow('OpenRouter model returned empty response content.');
      expect(() => cleanAndParseJSON('   ')).toThrow('OpenRouter model returned empty response content.');
    });

    it('extracts JSON from markdown code blocks with ```json tags or ``` tags', () => {
      const markdown = 'Here is your result:\n```json\n{"name": "CodeBlock JSON"}\n```';
      const parsed = cleanAndParseJSON<{ name: string }>(markdown);
      expect(parsed.name).toBe('CodeBlock JSON');

      const genericBlock = '```\n[1, 2, 3]\n```';
      expect(cleanAndParseJSON<number[]>(genericBlock)).toEqual([1, 2, 3]);
    });

    it('sanitizes trailing commas and inline comments from dirty JSON strings', () => {
      const dirty = `
      // This is a comment
      {
        "item": "Test",
        "count": 5, // Trailing comment
      }
      `;
      const parsed = cleanAndParseJSON<{ item: string; count: number }>(dirty);
      expect(parsed.item).toBe('Test');
      expect(parsed.count).toBe(5);
    });

    it('extracts inner JSON object when surrounded by conversational text', () => {
      const text = 'Sure! Here is the data: {"key": "value"} Hope this helps!';
      const parsed = cleanAndParseJSON<{ key: string }>(text);
      expect(parsed.key).toBe('value');
    });

    it('extracts inner JSON array when surrounded by text', () => {
      const text = 'Here are the skills: [{"id": 1}, {"id": 2}]';
      const parsed = cleanAndParseJSON<any[]>(text);
      expect(parsed).toHaveLength(2);
    });

    it('throws error for completely unparseable malformed text', () => {
      expect(() => cleanAndParseJSON('This is not JSON at all')).toThrow(
        'OpenRouter model returned malformed JSON structure.'
      );
    });
  });
});
