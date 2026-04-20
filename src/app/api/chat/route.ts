import { NextResponse } from "next/server";
import { ChatService } from "@/lib/services/chat.service";
import { createConversationSchema } from "@/lib/validations/chat";
import { requireAuth, isAuthenticated } from "@/server/middleware/auth-guard";
import { logAudit } from "@/server/middleware/audit";
import type { ApiResponse } from "@/types/api";

/**
 * GET /api/chat
 * List conversations for the authenticated user.
 * Query params: page, pageSize
 */
export async function GET(request: Request) {
  const session = await requireAuth();
  if (!isAuthenticated(session)) return session;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);

    const result = await ChatService.listConversations(
      session.user.id,
      page,
      pageSize,
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[GET /api/chat]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al obtener conversaciones" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/chat
 * Create a new conversation. Optionally send an initial message.
 * Body: { title?: string, initialMessage?: string }
 */
export async function POST(request: Request) {
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

  const parsed = createConversationSchema.safeParse(body);
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
    const conversation = await ChatService.createConversation(
      session.user.id,
      parsed.data.title,
    );

    let initialResponse = null;

    // If an initial message was provided, send it through the RAG pipeline
    if (parsed.data.initialMessage) {
      const result = await ChatService.sendMessage(
        conversation.id,
        session.user.id,
        parsed.data.initialMessage,
      );
      initialResponse = result.assistantMessage;
    }

    await logAudit({
      userId: session.user.id,
      action: "chat.conversation_created",
      resource: "ChatConversation",
      resourceId: conversation.id,
      details: {
        title: parsed.data.title ?? null,
        hasInitialMessage: !!parsed.data.initialMessage,
      },
      request,
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          conversation,
          initialResponse,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/chat]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al crear conversacion" },
      { status: 500 },
    );
  }
}
