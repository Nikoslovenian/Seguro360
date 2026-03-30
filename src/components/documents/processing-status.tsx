"use client";

import type { ProcessingStatus as ProcessingStatusType } from "@prisma/client";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface ProcessingStatusProps {
  status: ProcessingStatusType;
  className?: string;
}

const STATUS_CONFIG: Record<
  ProcessingStatusType,
  { label: string; color: string; animated: boolean }
> = {
  PENDING: {
    label: "Pendiente",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    animated: false,
  },
  QUEUED: {
    label: "En cola",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    animated: false,
  },
  EXTRACTING_TEXT: {
    label: "Extrayendo texto...",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    animated: true,
  },
  RUNNING_OCR: {
    label: "Procesando OCR...",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    animated: true,
  },
  EXTRACTING_STRUCTURED: {
    label: "Analizando con IA...",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    animated: true,
  },
  GENERATING_EMBEDDINGS: {
    label: "Indexando...",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    animated: true,
  },
  COMPLETED: {
    label: "Completado",
    color: "bg-green-50 text-green-700 border-green-200",
    animated: false,
  },
  FAILED: {
    label: "Error",
    color: "bg-red-50 text-red-700 border-red-200",
    animated: false,
  },
  NEEDS_REVIEW: {
    label: "Requiere revision",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    animated: false,
  },
};

export function ProcessingStatusBadge({
  status,
  className,
}: ProcessingStatusProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge
      variant="outline"
      className={cn(config.color, "gap-1.5", className)}
    >
      {config.animated && (
        <Loader2 className="size-3 animate-spin" />
      )}
      {config.label}
    </Badge>
  );
}
