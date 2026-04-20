/**
 * Text extraction from PDF and image files.
 *
 * - PDFs: Uses pdf-parse (v3) for native text; falls back to Claude vision for scanned PDFs
 * - Images (JPG, PNG, WebP, TIFF): Uses Claude vision OCR
 */

import { PDFParse } from "pdf-parse";
import Anthropic from "@anthropic-ai/sdk";

export interface TextExtractionResult {
  text: string;
  pageCount: number;
  isScanned: boolean;
  method: "pdf-parse" | "claude-vision-ocr";
}

/**
 * Extract text from a file buffer.
 */
export async function extractText(
  buffer: Buffer,
  fileType: string,
): Promise<TextExtractionResult> {
  const isPdf = fileType === "application/pdf" || fileType.endsWith("pdf");

  if (isPdf) {
    return extractFromPdf(buffer);
  }

  // Image files -> Claude vision OCR
  return extractFromImage(buffer, fileType);
}

// -- PDF extraction --------------------------------------------------------

const MIN_CHARS_PER_PAGE = 50; // Below this threshold, consider it scanned

async function extractFromPdf(buffer: Buffer): Promise<TextExtractionResult> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });

  try {
    const result = await parser.getText();
    const pageCount = result.pages.length || 1;
    const text = result.text?.trim() ?? "";

    // Check if it's a scanned PDF (very little text per page)
    const charsPerPage = text.length / Math.max(pageCount, 1);
    const isScanned = charsPerPage < MIN_CHARS_PER_PAGE;

    if (isScanned) {
      console.log(
        `[extract] Scanned PDF detected (${charsPerPage.toFixed(0)} chars/page). Using Claude vision OCR.`,
      );
      return extractFromImage(buffer, "application/pdf");
    }

    return {
      text,
      pageCount,
      isScanned: false,
      method: "pdf-parse",
    };
  } finally {
    await parser.destroy();
  }
}

// -- Image / scanned PDF extraction via Claude vision ----------------------

async function extractFromImage(
  buffer: Buffer,
  fileType: string,
): Promise<TextExtractionResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Map file type to Claude media type
  const mediaType = mapMediaType(fileType);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: buffer.toString("base64"),
            },
          },
          {
            type: "text",
            text: `Eres un experto en OCR de documentos de seguros chilenos.

Extrae TODO el texto visible en este documento, manteniendo la estructura original lo mejor posible.
Incluye:
- Encabezados y titulos
- Numeros de poliza, RUTs, fechas
- Tablas (representalas con formato legible)
- Letras chicas y notas al pie
- Montos, porcentajes, limites

Responde SOLO con el texto extraido, sin comentarios adicionales.`,
          },
        ],
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  return {
    text,
    pageCount: 1, // can't determine from image
    isScanned: true,
    method: "claude-vision-ocr",
  };
}

function mapMediaType(
  fileType: string,
): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  if (fileType.includes("png")) return "image/png";
  if (fileType.includes("webp")) return "image/webp";
  if (fileType.includes("gif")) return "image/gif";
  // Default: jpeg (also handles application/pdf sent as image, tiff, etc.)
  return "image/jpeg";
}
