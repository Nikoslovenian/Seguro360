import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PolicyService } from "@/lib/services/policy.service";
import { createPolicySchema } from "@/lib/validations/policy";
import { logAudit } from "@/server/middleware/audit";
import type { ApiResponse } from "@/types/api";
import type { InsuranceCategory, PolicyStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "No autenticado" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as InsuranceCategory | null;
    const status = searchParams.get("status") as PolicyStatus | null;
    const search = searchParams.get("search") ?? undefined;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);

    const result = await PolicyService.listByUser(session.user.id, {
      category: category ?? undefined,
      status: status ?? undefined,
      search,
      page,
      pageSize,
    });

    return NextResponse.json<ApiResponse>({ success: true, data: result });
  } catch (error) {
    console.error("[GET /api/policies]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al obtener polizas" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "No autenticado" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = createPolicySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: parsed.error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 },
      );
    }

    const policy = await PolicyService.create(session.user.id, parsed.data);

    await logAudit({
      userId: session.user.id,
      action: "policy.create",
      resource: "InsurancePolicy",
      resourceId: policy.id,
      details: {
        category: parsed.data.category,
        insuranceCompany: parsed.data.insuranceCompany,
      },
      request,
    });

    return NextResponse.json<ApiResponse>(
      { success: true, data: policy },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/policies]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al crear poliza" },
      { status: 500 },
    );
  }
}
