import * as fs from 'fs';
const cheerio = require('cheerio');

export class HTMLExtractor {
  extractText(filePath: string): string {
    try {
      const htmlContent = fs.readFileSync(filePath, 'utf-8');
      const $ = cheerio.load(htmlContent);


      const text = $('body').text().trim();
      return text;
    } catch (error) {
      throw new Error(`Error extracting text from HTML file ${filePath}: ${error}`);
    }
  }
}
