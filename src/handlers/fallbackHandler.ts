import { LanguageModelService } from '@services/languageModelService';
import logger from '@utils/logger';

export class FallbackHandler {
  constructor(private languageModelService: LanguageModelService) {}

  async handle(query: string): Promise<string> {
    logger.info('No results from vector search. Using fallback handler.');

    try {
      const fallbackResponse =
        await this.languageModelService.generateResponse(query);
      if (fallbackResponse) {
        return fallbackResponse;
      }

      return "I couldn't find anything helpful in my database. Can you provide more details or rephrase your question?";
    } catch (error) {
      logger.error('Error during fallback handling:', error);
      return 'Sorry, I couldn’t process your request.';
    }
  }
}
