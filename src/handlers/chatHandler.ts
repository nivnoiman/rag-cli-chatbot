import * as readline from 'readline';
import validator from 'validator';
import logger from '@utils/logger';
import { SearchService } from '@services/searchService';
import { FallbackHandler } from '@handlers/fallbackHandler';
import { LanguageModelService } from '@services/languageModelService';

const MAX_INPUT_LENGTH = 500;

export class ChatHandler {
  private context: string[] = [];

  constructor(
    private searchService: SearchService,
    private fallbackHandler: FallbackHandler,
    private languageModelService: LanguageModelService
  ) {}

  start() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.setPrompt('You: ');
    rl.prompt();

    rl.on('line', async (line) => {
      const query = line.trim();

      if (validator.isEmpty(query)) {
        console.log('Bot: Please enter a question.');
        rl.prompt();
        return;
      }

      if (query.length > MAX_INPUT_LENGTH) {
        console.log(
          `Bot: Input is too long. Please limit your query to ${MAX_INPUT_LENGTH} characters.`
        );
        rl.prompt();
        return;
      }

      if (query.toLowerCase() === 'exit') {
        rl.close();
        return;
      }

      const disallowedPattern =
        /<script.*?>.*?<\/script.*?>|DROP TABLE|SELECT \* FROM|INSERT INTO|DELETE FROM|UPDATE SET|--|\/\*|\*\/|['";]/gi;

      if (disallowedPattern.test(query)) {
        console.log('Bot: Invalid input detected.');
        rl.prompt();
        return;
      }

      if (!validator.isAscii(query)) {
        console.log('Bot: Invalid input. Please use ASCII characters only.');
        rl.prompt();
        return;
      }

      const response = await this.getResponse(query);
      console.log(`Bot: ${response}`);
      rl.prompt();
    });
  }

  private async getResponse(query: string): Promise<string> {
    try {
      const searchResults = await this.searchService.search(query);

      if (searchResults) {
        return await this.handleSearchResults(query, searchResults);
      }

      return await this.handleFallback(query);
    } catch (error) {
      logger.error('Error during chatbot interaction:', error);
      return 'Sorry, something went wrong.';
    }
  }

  private async handleSearchResults(
    query: string,
    searchResults: string
  ): Promise<string> {
    const prompt = `
    You are an AI assistant for the R&D team, designed to provide accurate and structured answers to questions using the company's internal data. Your goal is to help team members find relevant information from the provided context. 

    Here is the question:
    ${query}

    Here are some relevant results from the company's internal data:
    ${searchResults}

    Instructions:
    1. Analyze the question and the provided data.
    2. If the provided data contains the answer, craft a concise and structured response that directly addresses the question. Highlight key points and explain them simply.
    3. If the provided data is insufficient to answer the question, respond with: "I don't know. The data provided does not contain enough information to answer this question."
    4. Provide only the answer and no additional information and Be concise and avoid repetitive statements.`;

    try {
      const modelResponse =
        await this.languageModelService.generateResponse(prompt);
      this.updateContext(query, modelResponse);
      return modelResponse;
    } catch (error) {
      logger.error('Error generating response:', error);
    }
    return '';
  }

  private async handleFallback(query: string): Promise<string> {
    const fallbackResponse = await this.fallbackHandler.handle(query);
    const answer = fallbackResponse || "I couldn't find anything relevant.";
    this.updateContext(query, answer);

    return answer;
  }

  private updateContext(query: string, response: string) {
    this.context.push(`Q: ${query}\nA: ${response}`);
    if (this.context.length > 5) {
      this.context.shift();
    }
  }
}
