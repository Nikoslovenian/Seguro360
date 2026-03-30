"use client";

import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { CONFIDENCE_THRESHOLDS } from "@/lib/constants";

interface ConfidenceBadgeProps {
  confidence: number | null | undefined;
  className?: string;
}

function getConfidenceConfig(confidence: number) {
  if (confidence > CONFIDENCE_THRESHOLDS.HIGH) {
    return {
      label: "Alta confianza",
      color: "bg-green-50 text-green-700 border-green-200",
    };
  }
  if (confidence > CONFIDENCE_THRESHOLDS.MEDIUM) {
    return {
      label: "Confianza media",
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    };
  }
  if (confidence > CONFIDENCE_THRESHOLDS.LOW) {
    return {
      label: "Confianza baja",
      color: "bg-orange-50 text-orange-700 border-orange-200",
    };
  }
  return {
    label: "Verificacion requerida",
    color: "bg-red-50 text-red-700 border-red-200",
  };
}

export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  if (confidence === null || confidence === undefined) {
    return (
      <Badge variant="outline" className={cn("bg-gray-50 text-gray-500 border-gray-200", className)}>
        Sin datos
      </Badge>
    );
  }

  const config = getConfidenceConfig(confidence);

  return (
    <Badge variant="outline" className={cn(config.color, className)}>
      {config.label}
    </Badge>
  );
}
