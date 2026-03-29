import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { DashboardService } from "@/lib/services/dashboard.service";
import type { ApiResponse } from "@/types/api";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "No autenticado" },
        { status: 401 },
      );
    }

    const scores = await DashboardService.getProtectionScores(session.user.id);

    return NextResponse.json<ApiResponse>({ success: true, data: scores });
  } catch (error) {
    console.error("[GET /api/dashboard/protection-score]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al calcular scores de proteccion" },
      { status: 500 },
    );
  }
}
