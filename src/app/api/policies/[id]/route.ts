import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PolicyService } from "@/lib/services/policy.service";
import { updatePolicySchema } from "@/lib/validations/policy";
import { logAudit } from "@/server/middleware/audit";
import { safeParseJson } from "@/lib/utils/parse-json";
import type { ApiResponse } from "@/types/api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "No autenticado" },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const policy = await PolicyService.findById(id, session.user.id);

    if (!policy) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Poliza no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json<ApiResponse>({ success: true, data: policy });
  } catch (error) {
    console.error("[GET /api/policies/[id]]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al obtener poliza" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "No autenticado" },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const [body, parseError] = await safeParseJson(request);
    if (parseError) return parseError;

    const parsed = updatePolicySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: parsed.error.issues.map((e) => e.message).join(", "),
        },
        { status: 400 },
      );
    }

    const policy = await PolicyService.update(id, session.user.id, parsed.data);

    if (!policy) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Poliza no encontrada" },
        { status: 404 },
      );
    }

    await logAudit({
      userId: session.user.id,
      action: "policy.update",
      resource: "InsurancePolicy",
      resourceId: id,
      details: { updatedFields: Object.keys(parsed.data) },
      request,
    });

    return NextResponse.json<ApiResponse>({ success: true, data: policy });
  } catch (error) {
    console.error("[PATCH /api/policies/[id]]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al actualizar poliza" },
      { status: 500 },
    );
  }
}
