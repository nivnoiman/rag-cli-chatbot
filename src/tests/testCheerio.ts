import * as fs from 'fs';
const cheerio = require('cheerio');

const filePath = './data/raw/Frontend responsibilities - XDR Server - Confluence Datacenter.html';

try {
  const htmlContent = fs.readFileSync(filePath, 'utf-8');
  console.log(`HTML content length: ${htmlContent.length}`);

  const $ = cheerio.load(htmlContent);

  const text = $('body').text().trim();
  console.log('Extracted text:', text.substring(0, 200)); // Log first 200 characters
} catch (error) {
  console.error('Error during cheerio test:', error);
}
