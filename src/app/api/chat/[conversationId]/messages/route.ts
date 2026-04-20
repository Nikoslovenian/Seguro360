import { NextResponse } from "next/server";
import { ChatService } from "@/lib/services/chat.service";
import { sendMessageSchema } from "@/lib/validations/chat";
import { requireAuth, isAuthenticated } from "@/server/middleware/auth-guard";
import { logAudit } from "@/server/middleware/audit";
import type { ApiResponse } from "@/types/api";

interface RouteContext {
  params: Promise<{ conversationId: string }>;
}

/**
 * GET /api/chat/[conversationId]/messages
 * Get messages for a conversation with pagination.
 * Query params: page, pageSize
 */
export async function GET(
  request: Request,
  context: RouteContext,
) {
  const session = await requireAuth();
  if (!isAuthenticated(session)) return session;

  try {
    const { conversationId } = await context.params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") ?? "50", 10);

    const result = await ChatService.getMessages(
      conversationId,
      session.user.id,
      page,
      pageSize,
    );

    if (!result) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Conversacion no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[GET /api/chat/[conversationId]/messages]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al obtener mensajes" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/chat/[conversationId]/messages
 * Send a message and get the AI-powered response.
 * Body: { content: string }
 */
export async function POST(
  request: Request,
  context: RouteContext,
) {
  const session = await requireAuth();
  if (!isAuthenticated(session)) return session;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Cuerpo de solicitud invalido" },
      { status: 400 },
    );
  }

  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: parsed.error.issues.map((e) => e.message).join(", "),
      },
      { status: 400 },
    );
  }

  try {
    const { conversationId } = await context.params;

    const result = await ChatService.sendMessage(
      conversationId,
      session.user.id,
      parsed.data.content,
    );

    await logAudit({
      userId: session.user.id,
      action: "chat.message_sent",
      resource: "ChatMessage",
      resourceId: result.assistantMessage.id,
      details: {
        conversationId,
        confidenceLabel: result.assistantMessage.confidenceLabel,
        model: result.assistantMessage.model,
        promptTokens: result.assistantMessage.promptTokens,
        completionTokens: result.assistantMessage.completionTokens,
      },
      request,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        userMessage: result.userMessage,
        assistantMessage: result.assistantMessage,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al enviar mensaje";

    // Known business errors return 404
    if (
      message === "Conversacion no encontrada" ||
      message === "La conversacion esta cerrada"
    ) {
      const status = message === "Conversacion no encontrada" ? 404 : 400;
      return NextResponse.json<ApiResponse>(
        { success: false, error: message },
        { status },
      );
    }

    console.error("[POST /api/chat/[conversationId]/messages]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al enviar mensaje" },
      { status: 500 },
    );
  }
}
