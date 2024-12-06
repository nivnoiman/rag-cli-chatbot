import { describe, it, expect, beforeAll } from 'vitest';
import { EmbeddingService } from '../embeddingService';

describe('EmbeddingService', () => {
  let embeddingService: EmbeddingService;

  beforeAll(async () => {
    embeddingService = new EmbeddingService();
    await embeddingService.loadModel();
  }, 10000); // Increase timeout if necessary

  it('should generate embedding for given text', async () => {
    const text = 'Hello world';
    const embedding = await embeddingService.generateEmbedding(text);
    expect(embedding).toBeDefined();
    expect(Array.isArray(embedding)).toBe(true);
  });
});
