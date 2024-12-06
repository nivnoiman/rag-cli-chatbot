import * as fs from 'fs';
import { Document, SearchResult } from 'src/models/Document';
import logger from '@utils/logger';

const kdTree = require('kd-tree-javascript');

export class VectorStore {
  private documents: Document[] = [];
  private tree: any;

  constructor() {}

  addDocument(doc: Document): void {
    this.documents.push(doc);
  }

  buildIndex(): void {
    if (this.documents.length === 0) {
      logger.warn('No documents available to build the index.');
      return;
    }

    const distance = (a: Document, b: Document): number => {
      if (!Array.isArray(a.embedding) || !Array.isArray(b.embedding)) {
        logger.error('Invalid embedding in documents:', { a, b });
        return Infinity;
      }

      return Math.sqrt(
        a.embedding.reduce((sum, val, idx) => {
          const diff = val - (b.embedding[idx] || 0);
          return sum + Math.pow(diff, 2);
        }, 0)
      );
    };

    this.tree = new kdTree.kdTree(this.documents, distance, ['embedding']);
    logger.info('kdTree built successfully.');
  }

  search(embedding: number[], k: number): SearchResult[] {
    if (!this.tree) {
      this.buildIndex();
    }

    if (!Array.isArray(embedding) || embedding.some(isNaN)) {
      logger.error('Invalid query embedding:', embedding);
      return [];
    }

    const queryDoc: Document = { id: '', embedding, content: '' };
    let results: [Document, number][] = [];

    try {
      results = this.tree.nearest(queryDoc, k) as [Document, number][];
    } catch (error) {
      logger.error('Error during search:', error);
      return [];
    }

    if (!Array.isArray(results) || results.length === 0) {
      logger.warn('No relevant documents found during search.');
      return [];
    }

    return results.filter(([doc, similarity]) => {
      if (!doc || typeof similarity !== 'number' || similarity <= 0) {
        logger.warn('Invalid result format:', { doc, similarity });
        return false;
      }
      return true;
    });
  }

  save(filePath: string): void {
    const data = JSON.stringify(this.documents, null, 2);
    fs.writeFileSync(filePath, data);
  }

  load(filePath: string): void {
    const data = fs.readFileSync(filePath, 'utf-8');
    this.documents = JSON.parse(data);
    this.buildIndex();
  }
}
