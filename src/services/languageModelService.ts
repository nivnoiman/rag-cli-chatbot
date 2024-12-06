import axios from 'axios';
import { ILanguageModelService } from '../interfaces/ILanguageModelService';
import logger from '@utils/logger';

export class LanguageModelService implements ILanguageModelService {
  private serverUrl: string;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }
  async generateResponse(
    prompt: string,
    maxLength: number = 500
  ): Promise<string> {
    try {
      const response = await axios.post(`${this.serverUrl}/generate`, {
        prompt: prompt,
        max_length: maxLength,
      });

      if (response.data && response.data.response) {
        return response.data.response.trim();
      }
      logger.error('Invalid response format from the language model.');
      return 'Sorry, I couldn’t process your request.';
    } catch (error) {
      logger.error('Error communicating with the language model:', error);
      return 'Sorry, I could not process your request using the AI model.';
    }
  }
}
