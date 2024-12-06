import * as path from 'path';
import * as fs from 'fs';
import { DataProcessor } from './services/dataProcessor';
import { TextChunker } from './services/textChunker';
import { VectorStore } from './repositories/vectorStore';
import { EmbeddingService } from './services/embeddingService';
import logger from '@utils/logger';

async function processData() {
  logger.info('Starting data processing...');

  const dataProcessor = new DataProcessor();
  const textChunker = new TextChunker();
  const vectorStore = new VectorStore();
  const embeddingService = new EmbeddingService();

  const inputDir = path.join(__dirname, '..', 'data', 'raw');
  const outputDir = path.join(__dirname, '..', 'data', 'processed');
  const vectorStorePath = path.join(
    __dirname,
    '..',
    'data',
    'vectorStore.json'
  );

  let totalChunks = 0;
  let totalDocuments = 0;

  try {
    await dataProcessor.processFiles(inputDir, outputDir);

    const processedFiles = fs.readdirSync(outputDir);
    for (const file of processedFiles) {
      const ext = path.extname(file).toLowerCase();
      if (ext === '.txt') {
        const filePath = path.join(outputDir, file);
        const text = fs.readFileSync(filePath, 'utf-8');

        logger.info(`Processing file: ${file}`);

        const chunks = textChunker
          .chunkText(text, 500)
          .filter((chunk) => chunk.trim());
        totalChunks += chunks.length;

        for (const chunk of chunks) {
          try {
            const embedding = await embeddingService.generateEmbedding(chunk);

            if (!Array.isArray(embedding) || embedding.some(isNaN)) {
              logger.warn(
                `Skipping invalid embedding for chunk in file: ${file}`
              );
              continue;
            }

            vectorStore.addDocument({
              id: `${file}-${chunks.indexOf(chunk)}`,
              content: chunk,
              embedding,
            });

            totalDocuments++;
          } catch (embeddingError) {
            logger.error(
              `Error generating embedding for a chunk in file: ${file}`,
              embeddingError
            );
          }
        }
      }
    }

    if (totalDocuments === 0) {
      logger.warn(
        'No valid documents were processed. Ensure your input data is valid.'
      );
    }

    vectorStore.save(vectorStorePath);
    logger.info(`Vector store saved at: ${vectorStorePath}`);
  } catch (error) {
    logger.error('An error occurred during data processing:', error);
  }

  logger.info(
    `Data processing completed. Processed ${totalChunks} chunks and saved ${totalDocuments} documents.`
  );
}

processData();
