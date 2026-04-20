import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/api";
import { requireAuth, isAuthenticated } from "@/server/middleware/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireAuth();
  if (!isAuthenticated(session)) return session;

  try {
    const connection = await prisma.cMFConnection.findFirst({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    });

    if (!connection) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          status: "DISCONNECTED",
          lastSyncAt: null,
          mode: null,
        },
      });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        id: connection.id,
        status: connection.status,
        mode: connection.mode,
        lastSyncAt: connection.lastSyncAt,
        lastError: connection.lastError,
      },
    });
  } catch (error) {
    console.error("[GET /api/cmf/status]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al obtener estado CMF" },
      { status: 500 },
    );
  }
}
