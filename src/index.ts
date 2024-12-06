import 'module-alias/register';
import logger from '@utils/logger';
import { ChatHandler } from '@handlers/chatHandler';
import { SearchService } from '@services/searchService';
import { FallbackHandler } from '@handlers/fallbackHandler';
import { EmbeddingService } from '@services/embeddingService';
import { VectorStore } from '@repositories/vectorStore';
import { LanguageModelService } from '@services/languageModelService';

async function startChatbot() {
  logger.info('Starting the RAG Chatbot...');

  // Initialize
  const vectorStore = new VectorStore();
  const embeddingService = new EmbeddingService();
  const languageModelService = new LanguageModelService(
    'http://localhost:5000'
  );
  const searchService = new SearchService(vectorStore, embeddingService);
  const fallbackHandler = new FallbackHandler(languageModelService);

  // Load vector store
  const vectorStorePath = './data/vectorStore.json';
  vectorStore.load(vectorStorePath);

  // Load embedding model
  await embeddingService.loadModel();

  // Initialize chat
  const chatHandler = new ChatHandler(
    searchService,
    fallbackHandler,
    languageModelService
  );

  chatHandler.start();
}

startChatbot();
