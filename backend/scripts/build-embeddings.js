// Build-time script: chunk data/*.md and precompute Gemini embeddings.
// Run manually whenever the dataset changes: node scripts/build-embeddings.js
// Requires GEMINI_API_KEY in backend/.env (not committed).

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { chunkMarkdown } = require('../lib/chunker');
const { embedText } = require('../lib/geminiClient');

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_PATH = path.join(DATA_DIR, 'embeddings.json');

async function main() {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.md'));
  let allChunks = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8');
    const chunks = chunkMarkdown(content, file);
    allChunks = allChunks.concat(chunks);
  }

  console.log(`Chunked ${files.length} file(s) into ${allChunks.length} chunks.`);

  const results = [];
  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i];
    process.stdout.write(`Embedding chunk ${i + 1}/${allChunks.length}...\r`);
    const embedding = await embedText(chunk.text);
    results.push({ text: chunk.text, source: chunk.source, embedding });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results));
  console.log(`\nSaved ${results.length} embedded chunks to ${OUTPUT_PATH}`);
}

main().catch(err => {
  console.error('Failed to build embeddings:', err.response?.data || err.message);
  process.exit(1);
});
