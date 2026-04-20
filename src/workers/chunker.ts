/**
 * Text chunker for RAG (Retrieval-Augmented Generation).
 *
 * Splits document text into overlapping chunks suitable for embedding
 * and semantic search. Respects paragraph and section boundaries.
 */

export interface ChunkOptions {
  maxTokens: number;   // approximate max tokens per chunk (~4 chars/token)
  overlap: number;     // approximate overlap in tokens
}

export interface Chunk {
  content: string;
  pageNumber: number | null;
  section: string | null;
  tokenCount: number;
}

const CHARS_PER_TOKEN = 4; // rough approximation for Spanish text

/**
 * Split text into chunks with overlap, respecting paragraph boundaries.
 */
export function createChunks(
  text: string,
  options: ChunkOptions = { maxTokens: 512, overlap: 64 },
): Chunk[] {
  const maxChars = options.maxTokens * CHARS_PER_TOKEN;
  const overlapChars = options.overlap * CHARS_PER_TOKEN;

  if (text.length <= maxChars) {
    return [
      {
        content: text.trim(),
        pageNumber: 1,
        section: null,
        tokenCount: estimateTokens(text),
      },
    ];
  }

  // Split by double newlines (paragraph boundaries)
  const paragraphs = text.split(/\n{2,}/);
  const chunks: Chunk[] = [];

  let currentContent = "";
  let currentSection: string | null = null;
  let currentPage = 1;

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    // Detect page breaks (common in PDF extraction)
    const pageMatch = trimmed.match(/^[-—=\s]*(?:pagina|pag\.?|page)\s*(\d+)/i);
    if (pageMatch) {
      currentPage = parseInt(pageMatch[1], 10);
    }

    // Detect section headers (all caps or short lines ending with colon)
    if (
      (trimmed.length < 80 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) ||
      (trimmed.length < 100 && trimmed.endsWith(":"))
    ) {
      currentSection = trimmed.replace(/:$/, "").trim();
    }

    // If adding this paragraph would exceed max, flush current chunk
    if (currentContent.length + trimmed.length + 2 > maxChars && currentContent.length > 0) {
      chunks.push({
        content: currentContent.trim(),
        pageNumber: currentPage,
        section: currentSection,
        tokenCount: estimateTokens(currentContent),
      });

      // Keep overlap from end of current chunk
      if (overlapChars > 0 && currentContent.length > overlapChars) {
        currentContent = currentContent.slice(-overlapChars);
      } else {
        currentContent = "";
      }
    }

    // If a single paragraph exceeds max, split it by sentences
    if (trimmed.length > maxChars) {
      const sentences = trimmed.match(/[^.!?]+[.!?]+/g) ?? [trimmed];
      for (const sentence of sentences) {
        if (currentContent.length + sentence.length + 1 > maxChars && currentContent.length > 0) {
          chunks.push({
            content: currentContent.trim(),
            pageNumber: currentPage,
            section: currentSection,
            tokenCount: estimateTokens(currentContent),
          });
          currentContent = currentContent.length > overlapChars
            ? currentContent.slice(-overlapChars)
            : "";
        }
        currentContent += (currentContent ? " " : "") + sentence.trim();
      }
    } else {
      currentContent += (currentContent ? "\n\n" : "") + trimmed;
    }
  }

  // Flush remaining content
  if (currentContent.trim().length > 0) {
    chunks.push({
      content: currentContent.trim(),
      pageNumber: currentPage,
      section: currentSection,
      tokenCount: estimateTokens(currentContent),
    });
  }

  return chunks;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}
