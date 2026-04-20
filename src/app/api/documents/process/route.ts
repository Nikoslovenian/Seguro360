import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { processDocumentSchema } from "@/lib/validations/document";
import { DocumentService } from "@/lib/services/document.service";
import { enqueueDocumentProcessing } from "@/lib/queue";
import { logAudit } from "@/server/middleware/audit";
import { safeParseJson } from "@/lib/utils/parse-json";
import type { ApiResponse } from "@/types/api";

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

    const parsed = processDocumentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: parsed.error.issues.map((e) => e.message).join(", "),
        },
        { status: 400 },
      );
    }

    const { documentId } = parsed.data;

    // Verify document exists and belongs to user
    const document = await DocumentService.findById(documentId, session.user.id);
    if (!document) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Documento no encontrado" },
        { status: 404 },
      );
    }

    if (document.processingStatus !== "PENDING" && document.processingStatus !== "FAILED") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "El documento ya esta siendo procesado o fue completado" },
        { status: 409 },
      );
    }

    // Update status to QUEUED
    await DocumentService.updateStatus(documentId, "QUEUED");

    // Add job to BullMQ queue
    await enqueueDocumentProcessing({
      documentId: document.id,
      userId: session.user.id,
      fileName: document.fileName,
      fileType: document.fileType,
      storagePath: document.storagePath,
      storageBucket: document.storageBucket,
    });

    await logAudit({
      userId: session.user.id,
      action: "document.process",
      resource: "PolicyDocument",
      resourceId: documentId,
      request,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { documentId, status: "QUEUED" },
    });
  } catch (error) {
    console.error("[POST /api/documents/process]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al iniciar procesamiento" },
      { status: 500 },
    );
  }
}
