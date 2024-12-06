import * as fs from 'fs';
import * as path from 'path';
import { PDFExtractor } from './pdfExtractor';
import { HTMLExtractor } from './htmlExtractor';
import logger from 'src/utils/logger';


export class DataProcessor {
  private pdfExtractor: PDFExtractor;
  private htmlExtractor: HTMLExtractor;

  constructor() {
    this.pdfExtractor = new PDFExtractor();
    this.htmlExtractor = new HTMLExtractor();
  }

  async processFiles(inputDir: string, outputDir: string): Promise<void> {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const files = fs.readdirSync(inputDir);
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      const filePath = path.join(inputDir, file);
      let text = '';

      try {
        if (ext === '.pdf') {
          logger.info(`Processing PDF file: ${file}`);
          text = await this.pdfExtractor.extractText(filePath);
        } else if (ext === '.html' || ext === '.htm') {
          logger.info(`Processing HTML file: ${file}`);
          text = this.htmlExtractor.extractText(filePath);
        } else {
          logger.warn(`Skipping unsupported file type: ${file}`);
          continue;
        }

        const outputFileName = `${path.basename(file, ext)}.txt`;
        const outputFilePath = path.join(outputDir, outputFileName);
        fs.writeFileSync(outputFilePath, text);
        logger.info(`Processed and saved: ${outputFileName}`);
      } catch (error) {
        logger.error(`Error processing file ${file}: ${error}`);
      }
    }
  }
}
