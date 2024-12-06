export interface ILanguageModelService {
    generateResponse(prompt: string, maxLength?: number): Promise<string>;
  }
  