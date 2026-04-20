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

    const summary = await AgentService.getPortfolioSummary(profile.id);

    return NextResponse.json<ApiResponse>({ success: true, data: summary });
  } catch (error) {
    console.error("[GET /api/agent/portfolio]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al obtener resumen del portafolio" },
      { status: 500 },
    );
  }
}
