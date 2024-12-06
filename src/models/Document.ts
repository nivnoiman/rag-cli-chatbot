export type SearchResult = [Document, number];

export interface Document {
  id: string;
  content: string;
  embedding: number[];
}
