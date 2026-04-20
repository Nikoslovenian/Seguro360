import { NextRequest, NextResponse } from "next/server";
import { requireRole, isAuthenticated } from "@/server/middleware/auth-guard";
import { AgentService } from "@/lib/services/agent.service";
import type { ApiResponse } from "@/types/api";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole("AGENT", "ADMIN");
    if (!isAuthenticated(authResult)) {
      return authResult;
    }

    const session = authResult;
    const profile = await AgentService.getProfile(session.user.id);

    if (!profile) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Perfil de agente no encontrado" },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);

    const result = await AgentService.listClients(profile.id, {
      search,
      page,
      pageSize,
    });

    return NextResponse.json<ApiResponse>({ success: true, data: result });
  } catch (error) {
    console.error("[GET /api/agent/clients]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al obtener clientes" },
      { status: 500 },
    );
  }
}
