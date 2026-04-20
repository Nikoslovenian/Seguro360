import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthenticated } from "@/server/middleware/auth-guard";
import { logAudit } from "@/server/middleware/audit";
import { simulationSchema } from "@/lib/validations/simulation";
import { SimulationService } from "@/lib/services/simulation.service";
import type { ApiResponse } from "@/types/api";

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

  const parsed = simulationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Datos invalidos",
      },
      { status: 400 },
    );
  }

  try {
    const result = await SimulationService.simulate(
      session.user.id,
      parsed.data,
    );

    await logAudit({
      userId: session.user.id,
      action: "simulation.run",
      resource: "SimulationScenario",
      resourceId: result.scenario.id,
      details: {
        eventType: parsed.data.eventType,
        claimAmount: parsed.data.claimAmount,
        currency: parsed.data.currency,
        policiesEvaluated: result.summary.policyResults.length,
        totalCovered: result.summary.totalCovered,
        totalOutOfPocket: result.summary.totalOutOfPocket,
      },
      request,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[POST /api/simulate]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al ejecutar simulacion" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!isAuthenticated(session)) return session;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);

    const result = await SimulationService.listByUser(
      session.user.id,
      page,
      pageSize,
    );

    return NextResponse.json<ApiResponse>({ success: true, data: result });
  } catch (error) {
    console.error("[GET /api/simulate]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al obtener historial de simulaciones" },
      { status: 500 },
    );
  }
}
