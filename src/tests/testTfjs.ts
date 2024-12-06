import * as tf from '@tensorflow/tfjs-node';
import { EmbeddingService } from '../services/embeddingService';

async function testEmbedding() {
  const embeddingService = new EmbeddingService();
  await embeddingService.loadModel();
  const embedding = await embeddingService.generateEmbedding('Hello world');
  console.log('Embedding length:', embedding.length);
  console.log('Embedding:', embedding.slice(0, 5)); // Print first 5 values
}

testEmbedding();
