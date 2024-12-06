import logger from '@utils/logger';
import { VectorStore } from '@repositories/vectorStore';
import { EmbeddingService } from '@services/embeddingService';

export class SearchService {
  private confidenceThreshold = 0.8;

  constructor(
    private vectorStore: VectorStore,
    private embeddingService: EmbeddingService
  ) {}

  async search(query: string): Promise<string | null> {
    try {
      const queryEmbedding =
        await this.embeddingService.generateEmbedding(query);
      const results = this.vectorStore.search(queryEmbedding, 3);

      if (results.length === 0) {
        logger.info('No relevant results found in vector store.');
        return null;
      }

      const filteredResults = results.filter(
        ([, similarity]) => similarity >= this.confidenceThreshold
      );

      if (filteredResults.length === 0) {
        logger.info('No results exceeded the confidence threshold.');
        return null;
      }

      return filteredResults.map(([doc]) => doc.content).join('\n---\n');
    } catch (error) {
      logger.error('Error during vector search:', error);
      return null;
    }
  }
}
