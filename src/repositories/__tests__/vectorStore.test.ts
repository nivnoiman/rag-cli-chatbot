import { describe, it, expect, beforeAll } from 'vitest';
import { VectorStore } from '../vectorStore';
import { Document } from '../../models/Document';

describe('VectorStore', () => {
  let vectorStore: VectorStore;

  beforeAll(() => {
    vectorStore = new VectorStore();
  });

  it('should search for nearest documents', () => {
    const queryEmbedding = [0.1, 0.2, 0.3];
    const results = vectorStore.search(queryEmbedding, 1);

    expect(results.length).toBe(1);
    const [doc, similarity] = results[0];
    expect(doc.id).toBe('1');
    expect(similarity).toBeGreaterThan(0);
  });

  it('should handle multiple results', () => {
    const queryEmbedding = [0.1, 0.2, 0.3];
    const results = vectorStore.search(queryEmbedding, 2);

    expect(results.length).toBe(2);
    const [firstDoc, firstSimilarity] = results[0];
    const [secondDoc, secondSimilarity] = results[1];
    expect(firstSimilarity).toBeGreaterThanOrEqual(secondSimilarity);
  });
});
