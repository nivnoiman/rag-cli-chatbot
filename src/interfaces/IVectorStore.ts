import { Document } from '../models/Document';

export interface IVectorStore {
  addDocument(doc: Document): void;
  buildIndex(): void;
  search(embedding: number[], k: number): Document[];
  save(filePath: string): void;
  load(filePath: string): void;
}
