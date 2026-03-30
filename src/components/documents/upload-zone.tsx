"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { ACCEPTED_FILE_TYPES } from "@/lib/constants";
import { Upload, FileText, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { ProcessingStatusBadge } from "@/components/documents/processing-status";
import type { ProcessingStatus } from "@prisma/client";

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

const ACCEPTED_EXTENSIONS = "PDF, JPG, PNG, WebP, TIFF";

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "processing" | "completed" | "error";
  error?: string;
  documentId?: string;
  processingStatus?: ProcessingStatus;
}

interface UploadZoneProps {
  onUploadComplete?: (documentId: string) => void;
  className?: string;
}

export function UploadZone({ onUploadComplete, className }: UploadZoneProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateFile = useCallback(
    (id: string, update: Partial<UploadFile>) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...update } : f))
      );
    },
    []
  );

  const uploadFile = useCallback(
    async (uploadFile: UploadFile) => {
      const { id, file } = uploadFile;

      try {
        updateFile(id, { status: "uploading", progress: 10 });

        // Step 1: Get presigned URL
        const presignRes = await fetch("/api/documents/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
          }),
        });

        if (!presignRes.ok) {
          const err = await presignRes.json();
          throw new Error(err.error ?? "Error al obtener URL de subida");
        }

        const presignData = await presignRes.json();
        const { presignedUrl, documentId } = presignData.data;

        updateFile(id, { progress: 30, documentId });

        // Step 2: Upload file directly to presigned URL
        const uploadRes = await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const pct = 30 + Math.round((e.loaded / e.total) * 60);
              updateFile(id, { progress: pct });
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error("Error al subir archivo: " + xhr.statusText));
            }
          });

          xhr.addEventListener("error", () => {
            reject(new Error("Error de red al subir archivo"));
          });

          xhr.open("PUT", presignedUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });

        updateFile(id, {
          progress: 95,
          status: "processing",
          processingStatus: "PENDING",
        });

        // Step 3: Trigger processing
        await fetch("/api/documents/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId }),
        });

        updateFile(id, {
          progress: 100,
          status: "completed",
          processingStatus: "QUEUED",
        });

        onUploadComplete?.(documentId);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Error desconocido";
        updateFile(id, { status: "error", error: message });
      }
    },
    [updateFile, onUploadComplete]
  );

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const newFiles: UploadFile[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];

        // Validate file type
        if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
          newFiles.push({
            id: crypto.randomUUID(),
            file,
            progress: 0,
            status: "error",
            error: `Tipo de archivo no soportado: ${file.type || file.name.split(".").pop()}. Use ${ACCEPTED_EXTENSIONS}.`,
          });
          continue;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          newFiles.push({
            id: crypto.randomUUID(),
            file,
            progress: 0,
            status: "error",
            error: `El archivo excede el limite de ${MAX_FILE_SIZE_MB}MB.`,
          });
          continue;
        }

        newFiles.push({
          id: crypto.randomUUID(),
          file,
          progress: 0,
          status: "pending",
        });
      }

      setFiles((prev) => [...prev, ...newFiles]);

      // Start uploading valid files
      for (const f of newFiles) {
        if (f.status === "pending") {
          uploadFile(f);
        }
      }
    },
    [uploadFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
        // Reset input so same file can be selected again
        e.target.value = "";
      }
    },
    [handleFiles]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-gray-300 bg-white hover:border-primary/50 hover:bg-gray-50"
        )}
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <p className="mb-1 text-sm font-medium text-gray-900">
          Arrastre sus documentos aqui o haga clic para seleccionar
        </p>
        <p className="text-xs text-gray-500">
          {ACCEPTED_EXTENSIONS} - Maximo {MAX_FILE_SIZE_MB}MB por archivo
        </p>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILE_TYPES.join(",")}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((uploadFile) => (
            <div
              key={uploadFile.id}
              className="flex items-center gap-3 rounded-lg border bg-white p-3"
            >
              {/* File icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <FileText className="h-5 w-5 text-gray-500" />
              </div>

              {/* File info and progress */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {uploadFile.file.name}
                  </p>
                  <span className="shrink-0 text-xs text-gray-500">
                    {formatFileSize(uploadFile.file.size)}
                  </span>
                </div>

                {uploadFile.status === "error" && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="size-3" />
                    {uploadFile.error}
                  </div>
                )}

                {(uploadFile.status === "uploading" ||
                  uploadFile.status === "pending") && (
                  <div className="mt-2">
                    <Progress value={uploadFile.progress}>
                      <ProgressLabel className="sr-only">
                        Subiendo
                      </ProgressLabel>
                      <ProgressValue>
                        {({ value }) =>
                          value != null ? `${Math.round(value)}%` : ""
                        }
                      </ProgressValue>
                    </Progress>
                  </div>
                )}

                {(uploadFile.status === "processing" ||
                  uploadFile.status === "completed") &&
                  uploadFile.processingStatus && (
                    <div className="mt-1">
                      <ProcessingStatusBadge
                        status={uploadFile.processingStatus}
                      />
                    </div>
                  )}

                {uploadFile.status === "completed" &&
                  !uploadFile.processingStatus && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle2 className="size-3" />
                      Subido correctamente
                    </div>
                  )}
              </div>

              {/* Remove button */}
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(uploadFile.id);
                }}
                aria-label="Eliminar archivo"
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
