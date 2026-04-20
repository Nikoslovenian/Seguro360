import { NextResponse } from "next/server";
import { z } from "zod";
import type { ApiResponse } from "@/types/api";
import { requireAuth, isAuthenticated } from "@/server/middleware/auth-guard";
import { logAudit } from "@/server/middleware/audit";
import { prisma } from "@/lib/prisma";

const importSchema = z.object({
  mode: z.enum(["MANUAL_GUIDED", "FILE_IMPORT"]),
  policies: z
    .array(
      z.object({
        policyNumber: z.string().optional(),
        insuranceCompany: z.string().min(1),
        category: z.string().min(1),
        productName: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        premium: z.number().optional(),
      }),
    )
    .min(1, "Debe incluir al menos una poliza"),
});

export async function POST(request: Request) {
  const session = await requireAuth();
  if (!isAuthenticated(session)) return session;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Cuerpo de solicitud invalido" },
      { status: 400 },
    );
  }

  const parsed = importSchema.safeParse(body);
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
    const { mode, policies } = parsed.data;

    // Create or update CMF connection record
    const connection = await prisma.cMFConnection.upsert({
      where: {
        id:
          (
            await prisma.cMFConnection.findFirst({
              where: { userId: session.user.id },
              select: { id: true },
            })
          )?.id ?? "new",
      },
      update: {
        mode,
        status: "SYNCING",
        lastSyncAt: new Date(),
      },
      create: {
        userId: session.user.id,
        mode,
        status: "SYNCING",
      },
    });

    // Import each policy
    const created = [];
    for (const p of policies) {
      const policy = await prisma.insurancePolicy.create({
        data: {
          userId: session.user.id,
          policyNumber: p.policyNumber,
          insuranceCompany: p.insuranceCompany,
          category: p.category,
          startDate: p.startDate ? new Date(p.startDate) : undefined,
          endDate: p.endDate ? new Date(p.endDate) : undefined,
          premium: p.premium,
          premiumCurrency: "CLP",
          status: "PENDING_VERIFICATION",
          source: "CMF_IMPORT",
        },
      });
      created.push(policy);
    }

    // Mark connection as synced
    await prisma.cMFConnection.update({
      where: { id: connection.id },
      data: { status: "CONNECTED", lastSyncAt: new Date() },
    });

    await logAudit({
      userId: session.user.id,
      action: "cmf.import",
      resource: "CMFConnection",
      resourceId: connection.id,
      details: { mode, policiesImported: created.length },
      request,
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          connectionId: connection.id,
          importedCount: created.length,
          policies: created.map((p) => ({
            id: p.id,
            policyNumber: p.policyNumber,
            company: p.insuranceCompany,
            category: p.category,
          })),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/cmf/import]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al importar polizas desde CMF" },
      { status: 500 },
    );
  }
}
