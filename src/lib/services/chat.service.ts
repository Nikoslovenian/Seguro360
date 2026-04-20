import { prisma } from "@/lib/prisma";
import { getAnthropicClient } from "@/lib/anthropic";
import type { ChatConversation, ChatMessage } from "@prisma/client";
import type { PaginatedResponse } from "@/types/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RetrievedChunk {
  chunkId: string;
  content: string;
  documentId: string;
  fileName: string;
  pageNumber: number | null;
  section: string | null;
  score: number;
}

interface Citation {
  fileName: string;
  pageNumber: number | null;
  section: string | null;
  chunkId: string;
}

type ConfidenceLabel = "HIGH" | "MEDIUM" | "LOW" | "UNCERTAIN";

export interface ConversationWithPreview extends ChatConversation {
  lastMessage: Pick<ChatMessage, "content" | "role" | "createdAt"> | null;
  messageCount: number;
}

export interface SendMessageResult {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}

// ---------------------------------------------------------------------------
// Spanish stopwords for keyword extraction
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  "el",
  "la",
  "de",
  "en",
  "que",
  "los",
  "las",
  "por",
  "con",
  "una",
  "del",
  "para",
  "como",
  "mas",
  "pero",
  "sus",
  "este",
  "esta",
  "son",
  "hay",
  "fue",
  "ser",
  "tiene",
  "todo",
  "desde",
  "eso",
  "uno",
  "les",
  "nos",
  "ese",
  "esa",
  "esos",
  "esas",
  "esto",
  "estos",
  "estas",
  "cual",
  "cuando",
  "donde",
  "quien",
  "entre",
  "sin",
  "sobre",
  "puede",
  "muy",
  "asi",
  "tambien",
  "cada",
  "otro",
  "otra",
  "otros",
  "otras",
  "solo",
  "bien",
  "aqui",
  "alla",
  "cual",
  "cuales",
  "quien",
  "quienes",
  "cuyo",
  "cuya",
  "cuyos",
  "cuyas",
  "mis",
  "tus",
  "nuestro",
  "nuestra",
  "vuestro",
  "vuestra",
]);

// ---------------------------------------------------------------------------
// System prompt template
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT_TEMPLATE = `Eres un experto en seguros chilenos. Tu rol es ayudar a los usuarios a entender sus pólizas de seguro.

REGLAS:
1. Responde SOLO basándote en los documentos de póliza proporcionados como contexto.
2. Si la información no está en los documentos, di claramente "No encontré esta información en tus pólizas cargadas."
3. Cita siempre la fuente: nombre del documento y página cuando estén disponibles.
4. Responde siempre en español de Chile.
5. Indica tu nivel de confianza: ALTA (dato explícito en póliza), MEDIA (inferencia razonable), BAJA (información parcial).
6. Incluye un disclaimer: "Esta respuesta es orientativa y no reemplaza asesoría profesional."
7. Usa formato con negritas (**texto**) para montos y datos clave.
8. Si detectas una patología GES/AUGE, menciónalo.

CONTEXTO DE PÓLIZAS DEL USUARIO:
{chunks}`;

const NO_DOCS_CONTEXT =
  "El usuario no tiene documentos de póliza cargados. Indica amablemente que necesita subir al menos un documento para que puedas ayudarle con consultas específicas sobre sus pólizas.";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics for stopword matching
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w))
    .filter((w, i, arr) => arr.indexOf(w) === i); // unique
}

function buildChunksContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return NO_DOCS_CONTEXT;

  return chunks
    .map((c, i) => {
      const page = c.pageNumber ? ` | Página ${c.pageNumber}` : "";
      const section = c.section ? ` | Sección: ${c.section}` : "";
      return `--- Fragmento ${i + 1} (${c.fileName}${page}${section}) ---\n${c.content}`;
    })
    .join("\n\n");
}

function parseConfidenceFromResponse(content: string): ConfidenceLabel {
  const upper = content.toUpperCase();
  // Look for explicit confidence markers in the response
  if (upper.includes("CONFIANZA: ALTA") || upper.includes("NIVEL DE CONFIANZA: ALTA")) return "HIGH";
  if (upper.includes("CONFIANZA: MEDIA") || upper.includes("NIVEL DE CONFIANZA: MEDIA")) return "MEDIUM";
  if (upper.includes("CONFIANZA: BAJA") || upper.includes("NIVEL DE CONFIANZA: BAJA")) return "LOW";
  if (upper.includes("NO ENCONTRÉ ESTA INFORMACIÓN") || upper.includes("NO ENCONTRE ESTA INFORMACION")) return "UNCERTAIN";

  // Fallback heuristics
  if (upper.includes("ALTA")) return "HIGH";
  if (upper.includes("MEDIA")) return "MEDIUM";
  if (upper.includes("BAJA")) return "LOW";
  return "UNCERTAIN";
}

function extractCitations(chunks: RetrievedChunk[]): Citation[] {
  return chunks.map((c) => ({
    fileName: c.fileName,
    pageNumber: c.pageNumber,
    section: c.section,
    chunkId: c.chunkId,
  }));
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const ChatService = {
  /**
   * Create a new chat conversation.
   */
  async createConversation(
    userId: string,
    title?: string,
  ): Promise<ChatConversation> {
    return prisma.chatConversation.create({
      data: {
        userId,
        title: title ?? null,
        isActive: true,
      },
    });
  },

  /**
   * List conversations for a user, ordered by most recent activity.
   * Includes a preview of the last message and a message count.
   */
  async listConversations(
    userId: string,
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedResponse<ConversationWithPreview>> {
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(100, Math.max(1, pageSize));
    const skip = (safePage - 1) * safePageSize;

    const where = { userId, isActive: true };

    const [conversations, total] = await Promise.all([
      prisma.chatConversation.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: safePageSize,
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              content: true,
              role: true,
              createdAt: true,
            },
          },
          _count: {
            select: { messages: true },
          },
        },
      }),
      prisma.chatConversation.count({ where }),
    ]);

    const items: ConversationWithPreview[] = conversations.map((conv) => {
      const { messages, _count, ...rest } = conv;
      return {
        ...rest,
        lastMessage: messages[0] ?? null,
        messageCount: _count.messages,
      };
    });

    return {
      items,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize),
    };
  },

  /**
   * Get a conversation with all its messages.
   * Returns null if not found or does not belong to the user.
   */
  async getConversation(
    conversationId: string,
    userId: string,
  ): Promise<(ChatConversation & { messages: ChatMessage[] }) | null> {
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation || conversation.userId !== userId) {
      return null;
    }

    return conversation;
  },

  /**
   * Delete (deactivate) a conversation. Ownership check included.
   * Returns the deleted conversation or null if not found / not owned.
   */
  async deleteConversation(
    conversationId: string,
    userId: string,
  ): Promise<ChatConversation | null> {
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || conversation.userId !== userId) {
      return null;
    }

    return prisma.chatConversation.update({
      where: { id: conversationId },
      data: { isActive: false },
    });
  },

  /**
   * RAG retrieval: search DocumentChunks using keyword matching.
   * Extracts keywords from the query, searches via LIKE, scores by match count.
   */
  async searchChunks(
    userId: string,
    query: string,
    topK = 5,
  ): Promise<RetrievedChunk[]> {
    const keywords = extractKeywords(query);

    if (keywords.length === 0) {
      // Fallback: get most recent chunks for the user
      const recentChunks = await prisma.documentChunk.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: topK,
        include: {
          document: {
            select: { fileName: true },
          },
        },
      });

      return recentChunks.map((c) => ({
        chunkId: c.id,
        content: c.content,
        documentId: c.documentId,
        fileName: c.document.fileName,
        pageNumber: c.pageNumber,
        section: c.section,
        score: 0,
      }));
    }

    // Fetch all chunks for this user that match at least one keyword
    // SQLite does not support full-text search natively in Prisma,
    // so we use OR conditions with LIKE and score in-memory.
    const chunks = await prisma.documentChunk.findMany({
      where: {
        userId,
        OR: keywords.map((kw) => ({
          content: { contains: kw },
        })),
      },
      include: {
        document: {
          select: { fileName: true },
        },
      },
    });

    // Score: count how many keywords appear in each chunk
    const scored = chunks.map((chunk) => {
      const lowerContent = chunk.content.toLowerCase();
      let score = 0;
      for (const kw of keywords) {
        if (lowerContent.includes(kw)) {
          score += 1;
        }
      }
      return {
        chunkId: chunk.id,
        content: chunk.content,
        documentId: chunk.documentId,
        fileName: chunk.document.fileName,
        pageNumber: chunk.pageNumber,
        section: chunk.section,
        score,
      };
    });

    // Sort by score descending, then by chunk index implicitly via insertion order
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, topK);
  },

  /**
   * Main RAG flow: send a user message and get an AI-powered response.
   */
  async sendMessage(
    conversationId: string,
    userId: string,
    content: string,
  ): Promise<SendMessageResult> {
    // 1. Verify conversation ownership
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: { _count: { select: { messages: true } } },
    });

    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversacion no encontrada");
    }

    if (!conversation.isActive) {
      throw new Error("La conversacion esta cerrada");
    }

    const isFirstExchange = conversation._count.messages === 0;

    // 2. Save user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        conversationId,
        role: "USER",
        content,
      },
    });

    // 3. Get conversation history (last 10 messages for context)
    const recentMessages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    const orderedHistory = recentMessages.reverse();

    // 4. Search chunks with the user's message
    const retrievedChunks = await this.searchChunks(userId, content);

    // 5. Build system prompt with retrieved context
    const chunksContext = buildChunksContext(retrievedChunks);
    const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace("{chunks}", chunksContext);

    // 6. Build messages array for Claude API
    const apiMessages = orderedHistory.map((msg) => ({
      role: msg.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: msg.content,
    }));

    // 7. Call Claude API
    const anthropic = getAnthropicClient();

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: apiMessages,
    });

    // 8. Extract response content
    const assistantContent =
      response.content
        .filter((block) => block.type === "text")
        .map((block) => ("text" in block ? block.text : ""))
        .join("\n") || "No pude generar una respuesta. Por favor intenta de nuevo.";

    // 9. Parse confidence and citations
    const confidenceLabel = parseConfidenceFromResponse(assistantContent);
    const citations = extractCitations(retrievedChunks);
    const chunkIds = retrievedChunks.map((c) => c.chunkId);

    // 10. Save assistant message
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        conversationId,
        role: "ASSISTANT",
        content: assistantContent,
        citations: citations.length > 0 ? JSON.stringify(citations) : null,
        confidenceLabel,
        retrievedChunkIds: chunkIds.length > 0 ? JSON.stringify(chunkIds) : null,
        promptTokens: response.usage?.input_tokens ?? null,
        completionTokens: response.usage?.output_tokens ?? null,
        model: response.model,
      },
    });

    // 11. Update conversation title if first exchange
    if (isFirstExchange && !conversation.title) {
      const autoTitle = content.length > 50 ? content.substring(0, 50) + "..." : content;
      await prisma.chatConversation.update({
        where: { id: conversationId },
        data: { title: autoTitle },
      });
    }

    // 12. Touch conversation updatedAt
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return { userMessage, assistantMessage };
  },

  /**
   * Get messages for a conversation with pagination.
   */
  async getMessages(
    conversationId: string,
    userId: string,
    page = 1,
    pageSize = 50,
  ): Promise<PaginatedResponse<ChatMessage> | null> {
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || conversation.userId !== userId) {
      return null;
    }

    const safePage = Math.max(1, page);
    const safePageSize = Math.min(100, Math.max(1, pageSize));
    const skip = (safePage - 1) * safePageSize;

    const where = { conversationId };

    const [messages, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where,
        orderBy: { createdAt: "asc" },
        skip,
        take: safePageSize,
      }),
      prisma.chatMessage.count({ where }),
    ]);

    return {
      items: messages,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize),
    };
  },
};
