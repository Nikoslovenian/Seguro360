import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthenticated } from "@/server/middleware/auth-guard";
import { LibraryService } from "@/lib/services/library.service";
import type { ApiResponse } from "@/types/api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const authResult = await requireAuth();
    if (!isAuthenticated(authResult)) {
      return authResult;
    }

    const { id } = await context.params;
    const entry = await LibraryService.findById(id);

    if (!entry) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Entrada de biblioteca no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json<ApiResponse>({ success: true, data: entry });
  } catch (error) {
    console.error("[GET /api/library/[id]]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al obtener entrada de biblioteca" },
      { status: 500 },
    );
  }
}
