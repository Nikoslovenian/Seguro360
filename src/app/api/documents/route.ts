import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { DocumentService } from "@/lib/services/document.service";
import { createDocumentSchema } from "@/lib/validations/document";
import { safeParseJson } from "@/lib/utils/parse-json";
import { logAudit } from "@/server/middleware/audit";
import type { ApiResponse } from "@/types/api";

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
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10) || 20));
    const sortBy = searchParams.get("sortBy") ?? "createdAt";
    const sortOrder =
      (searchParams.get("sortOrder") as "asc" | "desc") ?? "desc";

    const result = await DocumentService.listByUser(session.user.id, {
      page,
      pageSize,
      sortBy,
      sortOrder,
    });

    return NextResponse.json<ApiResponse>({ success: true, data: result });
  } catch (error) {
    console.error("[GET /api/documents]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al obtener documentos" },
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

    const parsed = createDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: parsed.error.issues.map((e) => e.message).join(", "),
        },
        { status: 400 },
      );
    }

    const { fileName, fileType, fileSize, storagePath } = parsed.data;

    const document = await DocumentService.create(session.user.id, {
      fileName,
      fileType,
      fileSize,
      storagePath,
      storageBucket: parsed.data.storageBucket,
    });

    await logAudit({
      userId: session.user.id,
      action: "document.create",
      resource: "PolicyDocument",
      resourceId: document.id,
      details: { fileName, fileType, fileSize },
      request,
    });

    return NextResponse.json<ApiResponse>(
      { success: true, data: document },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/documents]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al crear documento" },
      { status: 500 },
    );
  }
}
