import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { getPresignedUploadUrl } from "@/lib/s3";
import { presignRequestSchema } from "@/lib/validations/document";
import { DocumentService } from "@/lib/services/document.service";
import { logAudit } from "@/server/middleware/audit";
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

    const body = await request.json();
    const parsed = presignRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: parsed.error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 },
      );
    }

    const { fileName, fileType, fileSize } = parsed.data;

    // Generate a unique storage path
    const fileExtension = fileName.split(".").pop() ?? "bin";
    const storageKey = session.user.id + "/" + uuidv4() + "." + fileExtension;
    const bucket = process.env.S3_BUCKET ?? "documents";

    // Generate presigned URL for upload
    const presignedUrl = await getPresignedUploadUrl(
      bucket,
      storageKey,
      fileType,
      3600,
    );

    // Create the document record
    const document = await DocumentService.create(session.user.id, {
      fileName,
      fileType,
      fileSize,
      storagePath: storageKey,
      storageBucket: bucket,
    });

    await logAudit({
      userId: session.user.id,
      action: "document.presign",
      resource: "PolicyDocument",
      resourceId: document.id,
      details: { fileName, fileType, fileSize },
      request,
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          presignedUrl,
          documentId: document.id,
          storageKey,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/documents/presign]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al generar URL de subida" },
      { status: 500 },
    );
  }
}
