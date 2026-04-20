import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, isAuthenticated } from "@/server/middleware/auth-guard";
import { logAudit } from "@/server/middleware/audit";
import { safeParseJson } from "@/lib/utils/parse-json";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/api";

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
  locale: z.string().max(10).optional(),
});

export async function GET() {
  try {
    const result = await requireAuth();
    if (!isAuthenticated(result)) return result;
    const session = result;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        rut: true,
        role: true,
        locale: true,
        onboardingComplete: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { policies: true, documents: true, conversations: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json<ApiResponse>({ success: true, data: user });
  } catch (error) {
    console.error("[GET /api/profile]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al obtener perfil" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const result = await requireAuth();
    if (!isAuthenticated(result)) return result;
    const session = result;

    const [body, parseError] = await safeParseJson(request);
    if (parseError) return parseError;

    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: parsed.error.issues.map((e) => e.message).join(", "),
        },
        { status: 400 },
      );
    }

    // Filter out undefined values so we only update provided fields
    const data: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.phone !== undefined) data.phone = parsed.data.phone;
    if (parsed.data.locale !== undefined) data.locale = parsed.data.locale;

    if (Object.keys(data).length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "No se proporcionaron campos para actualizar" },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        rut: true,
        role: true,
        locale: true,
        onboardingComplete: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "profile.update",
      resource: "User",
      resourceId: session.user.id,
      details: { updatedFields: Object.keys(data) },
      request,
    });

    return NextResponse.json<ApiResponse>({ success: true, data: updated });
  } catch (error) {
    console.error("[PATCH /api/profile]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al actualizar perfil" },
      { status: 500 },
    );
  }
}
