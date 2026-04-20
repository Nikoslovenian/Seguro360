import { NextRequest, NextResponse } from "next/server";
import { requireRole, isAuthenticated } from "@/server/middleware/auth-guard";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/api";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole("ADMIN");
    if (!isAuthenticated(authResult)) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)),
    );
    const skip = (page - 1) * pageSize;

    const userId = searchParams.get("userId") ?? undefined;
    const action = searchParams.get("action") ?? undefined;
    const resource = searchParams.get("resource") ?? undefined;
    const dateFrom = searchParams.get("dateFrom") ?? undefined;
    const dateTo = searchParams.get("dateTo") ?? undefined;

    const where: Prisma.AuditLogWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = { contains: action };
    }

    if (resource) {
      where.resource = resource;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (!isNaN(from.getTime())) {
          where.createdAt.gte = from;
        }
      }
      if (dateTo) {
        const to = new Date(dateTo);
        if (!isNaN(to.getTime())) {
          // Include the entire "dateTo" day
          to.setHours(23, 59, 59, 999);
          where.createdAt.lte = to;
        }
      }
    }

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/audit]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al obtener registros de auditoria" },
      { status: 500 },
    );
  }
}
