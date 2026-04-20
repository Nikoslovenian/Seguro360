import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PolicyService } from "@/lib/services/policy.service";
import { createPolicySchema } from "@/lib/validations/policy";
import { logAudit } from "@/server/middleware/audit";
import { safeParseJson } from "@/lib/utils/parse-json";
import type { ApiResponse } from "@/types/api";
import type { InsuranceCategory, PolicyStatus } from "@/types/prisma-enums";

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
    const VALID_CATEGORIES = ["SALUD", "VIDA", "HOGAR", "VEHICULO", "ACCIDENTES", "HOSPITALIZACION", "INVALIDEZ", "RESPONSABILIDAD_CIVIL", "VIAJE", "OTRO"];
    const VALID_STATUSES = ["ACTIVE", "EXPIRED", "CANCELLED", "PENDING_VERIFICATION", "DRAFT"];

    const rawCategory = searchParams.get("category");
    const category = rawCategory && VALID_CATEGORIES.includes(rawCategory) ? rawCategory as InsuranceCategory : undefined;
    const rawStatus = searchParams.get("status");
    const status = rawStatus && VALID_STATUSES.includes(rawStatus) ? rawStatus as PolicyStatus : undefined;
    const search = searchParams.get("search") ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10) || 20));

    const result = await PolicyService.listByUser(session.user.id, {
      category,
      status,
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

    const [body, parseError] = await safeParseJson(request);
    if (parseError) return parseError;

    const parsed = createPolicySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: parsed.error.issues.map((e) => e.message).join(", "),
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
