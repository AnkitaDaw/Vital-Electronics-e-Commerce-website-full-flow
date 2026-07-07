const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Since docx is a zip file, we can read its entries using Node's standard libraries
// But a docx has compressed parts. We can unzip it using the 'zlib' module.
// Instead of custom unzip, let's use the PowerShell Expand-Archive command
// to extract the files, then we can read word/document.xml with Node.js.

const docxXmlPath = 'c:/Users/CODECLOUDS-ANKITA/Downloads/e-Commerce Website/temp_extract/02_Planning/document_unzipped';

if (!fs.existsSync(docxXmlPath)) {
  fs.mkdirSync(docxXmlPath, { recursive: true });
}

// Let's parse word/document.xml and output all text node contents.
function parseDocxXml(filePath, textOutputPath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // A robust regex to find all text between <w:t> tags
  // including spaces (xml:space="preserve")
  const regex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
  let matches;
  let texts = [];
  
  // Let's also look for paragraphs <w:p> to inject newlines
  // A simple way is to parse paragraph blocks first, then extract text inside them.
  const pRegex = /<w:p[^>]*>([\s\S]*?)<\/w:p>/g;
  let pMatches;
  
  while ((pMatches = pRegex.exec(content)) !== null) {
    const pContent = pMatches[1];
    let pTexts = [];
    let tMatches;
    const tRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
    while ((tMatches = tRegex.exec(pContent)) !== null) {
      pTexts.push(tMatches[1]);
    }
    if (pTexts.length > 0) {
      texts.push(pTexts.join(''));
    } else {
      // Keep empty line for empty paragraphs
      texts.push('');
    }
  }
  
  // If no paragraphs matched (unlikely), fallback to raw w:t extraction
  if (texts.length === 0) {
    while ((matches = regex.exec(content)) !== null) {
      texts.push(matches[1]);
    }
  }
  
  fs.writeFileSync(textOutputPath, texts.join('\n'), 'utf8');
  console.log(`Extracted text saved to ${textOutputPath}`);
}

const documentXml = 'c:/Users/CODECLOUDS-ANKITA/Downloads/e-Commerce Website/temp_extract/document_temp/word/document.xml';
parseDocxXml(documentXml, 'c:/Users/CODECLOUDS-ANKITA/Downloads/e-Commerce Website/temp_extract/extracted_detail.txt');
