import { OpenRouterClient } from '../src/core/ai/openrouterClient';

describe('OpenRouterClient Engine', () => {
  const originalApiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

  beforeEach(() => {
    jest.resetModules();
    process.env.EXPO_PUBLIC_OPENROUTER_API_KEY = 'sk-or-test-key-123';
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_OPENROUTER_API_KEY = originalApiKey;
  });

  it('throws an error if the OpenRouter API key is missing or is placeholder', async () => {
    process.env.EXPO_PUBLIC_OPENROUTER_API_KEY = 'placeholder-key';

    await expect(OpenRouterClient.generatePromptResponse('Hello')).rejects.toThrow(
      'OpenRouter API key is missing'
    );
  });

  it('sends a prompt request to OpenRouter and parses content successfully', async () => {
    const mockApiResponse = {
      choices: [
        {
          message: {
            content: 'Hello! I am Veya AI assistant.',
          },
        },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockApiResponse),
    });

    const response = await OpenRouterClient.generatePromptResponse('Hi', 'claude');

    expect(response.content).toEqual('Hello! I am Veya AI assistant.');
    expect(response.providerUsed).toEqual('claude');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-or-test-key-123',
        }),
      })
    );
  });

  it('throws an error if OpenRouter API returns a non-OK status code', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: jest.fn().mockResolvedValueOnce('Unauthorized API Key'),
    });

    await expect(OpenRouterClient.generatePromptResponse('Hi', 'gpt')).rejects.toThrow(
      'OpenRouter API Error (401): Unauthorized API Key'
    );
  });

  it('generates structured JSON from OpenRouter prompt response', async () => {
    const mockJsonResponse = {
      name: 'Generated Skill',
      category: 'Coding',
    };

    const mockApiResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify(mockJsonResponse),
          },
        },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockApiResponse),
    });

    const result = await OpenRouterClient.generateStructuredJSON<{ name: string; category: string }>(
      'Draft a skill',
      'Review React Native code'
    );

    expect(result.name).toEqual('Generated Skill');
    expect(result.category).toEqual('Coding');
  });

  it('extracts JSON when returned inside markdown code blocks with surrounding text', async () => {
    const rawContent = 'Here is your response:\n```json\n{\n  "status": "ok",\n  "count": 5,\n}\n```\nHope this helps!';

    const mockApiResponse = {
      choices: [
        {
          message: {
            content: rawContent,
          },
        },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockApiResponse),
    });

    const result = await OpenRouterClient.generateStructuredJSON<{ status: string; count: number }>(
      'Instruction',
      'Prompt'
    );

    expect(result.status).toEqual('ok');
    expect(result.count).toEqual(5);
  });

  it('throws an error when OpenRouter returns malformed JSON', async () => {
    const mockApiResponse = {
      choices: [
        {
          message: {
            content: '{ status: invalid json syntax',
          },
        },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockApiResponse),
    });

    await expect(
      OpenRouterClient.generateStructuredJSON('System', 'User Prompt')
    ).rejects.toThrow('OpenRouter model returned malformed JSON structure.');
  });

  it('throws an error when structured JSON request receives non-OK HTTP status', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: jest.fn().mockResolvedValueOnce('Internal Server Error'),
    });

    await expect(
      OpenRouterClient.generateStructuredJSON('System', 'Prompt')
    ).rejects.toThrow('OpenRouter Structured API Error (500)');
  });
});
