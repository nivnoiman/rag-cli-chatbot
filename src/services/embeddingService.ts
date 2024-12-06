import * as tf from '@tensorflow/tfjs-node';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import { IEmbeddingService } from '../interfaces/IEmbeddingService';
import logger from '@utils/logger';

export class EmbeddingService implements IEmbeddingService {
  private model: any;

  async loadModel(): Promise<void> {
    try {
      logger.info('Using TensorFlow backend: ', tf.getBackend());
      logger.info('Loading embedding model...');
      this.model = await use.load();
      logger.info('Embedding model loaded.');
    } catch (error) {
      logger.error('Error loading embedding model:', error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!this.model) {
        await this.loadModel();
      }
      const embeddings = await this.model.embed([text]);
      const embedding = embeddings.arraySync()[0];
      embeddings.dispose();
      return embedding;
    } catch (error) {
      logger.error('Error generating embedding:', error);
      throw error;
    }
  }
}
