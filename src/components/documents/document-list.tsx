"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { ProcessingStatusBadge } from "@/components/documents/processing-status";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";
import type { PolicyDocument, ProcessingStatus } from "@prisma/client";
import type { ApiResponse, PaginatedResponse } from "@/types/api";

interface DocumentListProps {
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getFileTypeLabel(fileType: string): string {
  const map: Record<string, string> = {
    "application/pdf": "PDF",
    "image/jpeg": "JPG",
    "image/png": "PNG",
    "image/webp": "WebP",
    "image/tiff": "TIFF",
  };
  return map[fileType] ?? fileType.split("/").pop()?.toUpperCase() ?? fileType;
}

export function DocumentList({ className }: DocumentListProps) {
  const router = useRouter();

  const { data, isLoading, error } = useQuery<
    ApiResponse<PaginatedResponse<PolicyDocument>>
  >({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("Error al cargar documentos");
      return res.json();
    },
    refetchInterval: 10000, // Poll every 10s to update processing status
  });

  const documents = data?.data?.items ?? [];

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Error al cargar documentos. Intente nuevamente.
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Sin documentos"
        description="Suba sus polizas de seguro para comenzar el analisis automatico."
        className={className}
      />
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border bg-white", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="hidden px-4 py-3 sm:table-cell">Tamano</th>
            <th className="px-4 py-3">Estado</th>
            <th className="hidden px-4 py-3 md:table-cell">Fecha</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {documents.map((doc) => (
            <tr
              key={doc.id}
              onClick={() => router.push(`/documents/${doc.id}`)}
              className="cursor-pointer transition-colors hover:bg-gray-50"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="truncate font-medium text-gray-900">
                    {doc.fileName}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-500">
                {getFileTypeLabel(doc.fileType)}
              </td>
              <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">
                {formatFileSize(doc.fileSize)}
              </td>
              <td className="px-4 py-3">
                <ProcessingStatusBadge
                  status={doc.processingStatus as ProcessingStatus}
                />
              </td>
              <td className="hidden px-4 py-3 text-gray-500 md:table-cell">
                {formatDate(doc.createdAt as unknown as string)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
