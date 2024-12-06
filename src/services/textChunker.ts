export class TextChunker {
    chunkText(text: string, maxChunkSize: number): string[] {
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      const chunks: string[] = [];
      let currentChunk = '';
  
      for (const sentence of sentences) {
        if ((currentChunk + sentence).length > maxChunkSize) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          currentChunk += ' ' + sentence;
        }
      }
  
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
  
      return chunks;
    }
  }
  