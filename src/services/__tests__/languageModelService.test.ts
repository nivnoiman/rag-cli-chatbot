import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { LanguageModelService } from '../languageModelService';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import logger from '@utils/logger';


describe('LanguageModelService', () => {
  let languageModelService: LanguageModelService;
  let mock: MockAdapter;

  beforeAll(() => {
    languageModelService = new LanguageModelService('http://localhost:5000');
    mock = new MockAdapter(axios);
    vi.spyOn(logger, 'error').mockImplementation(() => logger);
});

  afterEach(() => {
    mock.reset();
  });

  it('should generate a response from the language model', async () => {
    const prompt = 'Test prompt';
    const mockResponse = { response: 'Test response' };

    mock.onPost('http://localhost:5000/generate').reply(200, mockResponse);

    const response = await languageModelService.generateResponse(prompt);
    expect(response).toBe('Test response');
  });

  it('should handle errors gracefully', async () => {
    mock.onPost('http://localhost:5000/generate').networkError();

    await expect(languageModelService.generateResponse('Test')).rejects.toThrow(
      'Failed to generate response from language model.'
    );
  });
});
