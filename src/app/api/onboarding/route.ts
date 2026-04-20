import { NextResponse } from "next/server";
import { requireAuth, isAuthenticated } from "@/server/middleware/auth-guard";
import { logAudit } from "@/server/middleware/audit";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/api";

export async function GET() {
  try {
    const result = await requireAuth();
    if (!isAuthenticated(result)) return result;
    const session = result;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { onboardingComplete: true },
    });

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { onboardingComplete: user.onboardingComplete },
    });
  } catch (error) {
    console.error("[GET /api/onboarding]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al obtener estado de onboarding" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const result = await requireAuth();
    if (!isAuthenticated(result)) return result;
    const session = result;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingComplete: true },
    });

    await logAudit({
      userId: session.user.id,
      action: "onboarding.complete",
      resource: "User",
      resourceId: session.user.id,
      details: { onboardingComplete: true },
      request,
    });

    return NextResponse.json<ApiResponse>({ success: true });
  } catch (error) {
    console.error("[POST /api/onboarding]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al completar onboarding" },
      { status: 500 },
    );
  }
}
