// Simple markdown chunker: splits by section markers ("---" or headings)
// then further splits any oversized section by paragraph, with light overlap.
// Kept dependency-free (no langchain/faiss) so it stays deployable on serverless.

const MAX_CHARS = 900;
const OVERLAP_CHARS = 150;

function splitBySections(content) {
  // FAQ files use "---" as a hard section divider.
  // Handbook uses "##"/"###" headings. Split on both.
  const bySeparator = content.split(/\n---\n/g);
  const sections = [];
  for (const block of bySeparator) {
    const byHeading = block.split(/\n(?=#{2,3}\s)/g);
    for (const piece of byHeading) {
      const trimmed = piece.trim();
      if (trimmed) sections.push(trimmed);
    }
  }
  return sections;
}

function splitOversized(text) {
  if (text.length <= MAX_CHARS) return [text];

  const paragraphs = text.split(/\n\n+/);
  const chunks = [];
  let current = '';

  for (const para of paragraphs) {
    if ((current + '\n\n' + para).length > MAX_CHARS && current) {
      chunks.push(current.trim());
      // keep a small overlap tail for context continuity
      const tail = current.slice(-OVERLAP_CHARS);
      current = tail + '\n\n' + para;
    } else {
      current = current ? current + '\n\n' + para : para;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function chunkMarkdown(content, sourceName) {
  // Normalize CRLF -> LF first: the paragraph/heading split regexes below
  // match "\n\n" and "\n#", which silently fail to match "\r\n\r\n" / "\r\n#",
  // causing oversized sections (e.g. multi-page ones) to never get split.
  const normalized = content.replace(/\r\n/g, '\n');
  const sections = splitBySections(normalized);
  const chunks = [];
  for (const section of sections) {
    for (const piece of splitOversized(section)) {
      if (piece.length > 20) {
        chunks.push({ text: piece, source: sourceName });
      }
    }
  }
  return chunks;
}

module.exports = { chunkMarkdown };
