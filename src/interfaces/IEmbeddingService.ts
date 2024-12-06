export interface IEmbeddingService {
    loadModel(): Promise<void>;
    generateEmbedding(text: string): Promise<number[]>;
  }
  