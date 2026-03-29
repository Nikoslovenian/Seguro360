import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { DocumentService } from "@/lib/services/document.service";
import { deleteFile } from "@/lib/s3";
import { logAudit } from "@/server/middleware/audit";
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
    const document = await DocumentService.findById(id, session.user.id);

    if (!document) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Documento no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json<ApiResponse>({ success: true, data: document });
  } catch (error) {
    console.error("[GET /api/documents/[id]]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al obtener documento" },
      { status: 500 },
    );
  }
}

export async function DELETE(
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
    const document = await DocumentService.findById(id, session.user.id);

    if (!document) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Documento no encontrado" },
        { status: 404 },
      );
    }

    // Delete from S3
    try {
      await deleteFile(document.storageBucket, document.storagePath);
    } catch (s3Error) {
      console.error("[DELETE /api/documents/[id]] S3 delete failed:", s3Error);
      // Continue with DB deletion even if S3 fails
    }

    // Delete from database
    await DocumentService.delete(id, session.user.id);

    await logAudit({
      userId: session.user.id,
      action: "document.delete",
      resource: "PolicyDocument",
      resourceId: id,
      details: { fileName: document.fileName },
      request,
    });

    return NextResponse.json<ApiResponse>({ success: true });
  } catch (error) {
    console.error("[DELETE /api/documents/[id]]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al eliminar documento" },
      { status: 500 },
    );
  }
}
