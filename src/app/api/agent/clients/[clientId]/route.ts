import { NextRequest, NextResponse } from "next/server";
import { requireRole, isAuthenticated } from "@/server/middleware/auth-guard";
import { AgentService } from "@/lib/services/agent.service";
import type { ApiResponse } from "@/types/api";

interface RouteContext {
  params: Promise<{ clientId: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
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

    const { clientId } = await context.params;
    const client = await AgentService.getClientDetail(profile.id, clientId);

    if (!client) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Cliente no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json<ApiResponse>({ success: true, data: client });
  } catch (error) {
    console.error("[GET /api/agent/clients/[clientId]]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al obtener detalle del cliente" },
      { status: 500 },
    );
  }
}
