import { NextResponse } from "next/server";
import { ChatService } from "@/lib/services/chat.service";
import { requireAuth, isAuthenticated } from "@/server/middleware/auth-guard";
import { logAudit } from "@/server/middleware/audit";
import type { ApiResponse } from "@/types/api";

interface RouteContext {
  params: Promise<{ conversationId: string }>;
}

/**
 * GET /api/chat/[conversationId]
 * Get a conversation with all its messages.
 */
export async function GET(
  request: Request,
  context: RouteContext,
) {
  const session = await requireAuth();
  if (!isAuthenticated(session)) return session;

  try {
    const { conversationId } = await context.params;

    const conversation = await ChatService.getConversation(
      conversationId,
      session.user.id,
    );

    if (!conversation) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Conversacion no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error("[GET /api/chat/[conversationId]]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al obtener conversacion" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/chat/[conversationId]
 * Delete (deactivate) a conversation.
 */
export async function DELETE(
  request: Request,
  context: RouteContext,
) {
  const session = await requireAuth();
  if (!isAuthenticated(session)) return session;

  try {
    const { conversationId } = await context.params;

    const deleted = await ChatService.deleteConversation(
      conversationId,
      session.user.id,
    );

    if (!deleted) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Conversacion no encontrada" },
        { status: 404 },
      );
    }

    await logAudit({
      userId: session.user.id,
      action: "chat.conversation_deleted",
      resource: "ChatConversation",
      resourceId: conversationId,
      details: { title: deleted.title },
      request,
    });

    return NextResponse.json<ApiResponse>({ success: true });
  } catch (error) {
    console.error("[DELETE /api/chat/[conversationId]]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al eliminar conversacion" },
      { status: 500 },
    );
  }
}
