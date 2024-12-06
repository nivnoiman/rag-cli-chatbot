import * as fs from 'fs';
import pdf from 'pdf-parse';

export class PDFExtractor {
  async extractText(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  }
}
