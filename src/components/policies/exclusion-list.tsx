"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfidenceBadge } from "@/components/policies/confidence-badge";
import { ChevronDown, ChevronUp, Ban, AlertCircle } from "lucide-react";

interface Exclusion {
  id: string;
  description: string;
  category?: string | null;
  isAbsolute: boolean;
  confidence?: number | null;
  sourceText?: string | null;
}

interface ExclusionListProps {
  exclusions: Exclusion[];
  className?: string;
}

function ExclusionItem({ exclusion }: { exclusion: Exclusion }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            exclusion.isAbsolute ? "bg-red-50" : "bg-yellow-50"
          )}
        >
          {exclusion.isAbsolute ? (
            <Ban className="h-4 w-4 text-red-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-900">{exclusion.description}</p>

          {/* Badges */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={
                exclusion.isAbsolute
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-yellow-50 text-yellow-700 border-yellow-200"
              }
            >
              {exclusion.isAbsolute ? "Absoluta" : "Condicional"}
            </Badge>

            {exclusion.category && (
              <Badge variant="secondary">{exclusion.category}</Badge>
            )}

            <ConfidenceBadge confidence={exclusion.confidence} />
          </div>

          {/* Expandable source text */}
          {exclusion.sourceText && (
            <div className="mt-2">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setExpanded(!expanded)}
                className="gap-1 text-gray-500"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Ocultar texto fuente
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    Ver texto fuente
                  </>
                )}
              </Button>
              {expanded && (
                <div className="mt-2 rounded-md bg-gray-50 p-3 text-xs leading-relaxed text-gray-600">
                  {exclusion.sourceText}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ExclusionList({ exclusions, className }: ExclusionListProps) {
  if (exclusions.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        No se encontraron exclusiones para esta poliza.
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {exclusions.map((exclusion) => (
        <ExclusionItem key={exclusion.id} exclusion={exclusion} />
      ))}
    </div>
  );
}
