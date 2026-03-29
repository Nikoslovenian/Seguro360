import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { DocumentService } from "@/lib/services/document.service";
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
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);
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

    const body = await request.json();
    const { fileName, fileType, fileSize, storagePath } = body;

    if (!fileName || !fileType || !fileSize || !storagePath) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Campos requeridos: fileName, fileType, fileSize, storagePath" },
        { status: 400 },
      );
    }

    const document = await DocumentService.create(session.user.id, {
      fileName,
      fileType,
      fileSize,
      storagePath,
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
