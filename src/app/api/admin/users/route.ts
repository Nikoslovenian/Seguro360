import { NextRequest, NextResponse } from "next/server";
import { requireRole, isAuthenticated } from "@/server/middleware/auth-guard";
import { logAudit } from "@/server/middleware/audit";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/api";
import type { Prisma } from "@prisma/client";

/** Select all user fields except sensitive ones. */
const USER_SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  image: true,
  role: true,
  rut: true,
  phone: true,
  locale: true,
  onboardingComplete: true,
  organizationId: true,
  assignedAgentId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole("ADMIN");
    if (!isAuthenticated(authResult)) {
      return authResult;
    }

    const session = authResult;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)),
    );
    const skip = (page - 1) * pageSize;
    const role = searchParams.get("role") ?? undefined;
    const search = searchParams.get("search") ?? undefined;

    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [items, total, roleCounts] = await Promise.all([
      prisma.user.findMany({
        where,
        select: USER_SAFE_SELECT,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.user.count({ where }),
      prisma.user.groupBy({
        by: ["role"],
        _count: { role: true },
      }),
    ]);

    const countByRole: Record<string, number> = {};
    for (const entry of roleCounts) {
      countByRole[entry.role] = entry._count.role;
    }

    await logAudit({
      userId: session.user.id,
      action: "admin.users.list",
      resource: "User",
      details: { filters: { role, search }, page, pageSize },
      request,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        metadata: { countByRole },
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/users]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al obtener usuarios" },
      { status: 500 },
    );
  }
}
