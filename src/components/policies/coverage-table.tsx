"use client";

import { cn } from "@/lib/utils";
import { ConfidenceBadge } from "@/components/policies/confidence-badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/utils/currency";
import { MessageSquareText } from "lucide-react";

interface Coverage {
  id: string;
  name: string;
  description?: string | null;
  coveredAmount?: string | number | null;
  coveredPercent?: number | null;
  currency?: string;
  limitPerEvent?: string | number | null;
  limitAnnual?: string | number | null;
  confidence?: number | null;
  sourceText?: string | null;
}

interface CoverageTableProps {
  coverages: Coverage[];
  className?: string;
}

function toNumber(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined) return null;
  const n = typeof val === "string" ? parseFloat(val) : val;
  return isNaN(n) ? null : n;
}

export function CoverageTable({ coverages, className }: CoverageTableProps) {
  if (coverages.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        No se encontraron coberturas para esta poliza.
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn("overflow-x-auto rounded-lg border", className)}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3">Cobertura</th>
              <th className="px-4 py-3 text-right">Monto cubierto</th>
              <th className="hidden px-4 py-3 text-right sm:table-cell">
                Porcentaje
              </th>
              <th className="hidden px-4 py-3 text-right md:table-cell">
                Limite por evento
              </th>
              <th className="hidden px-4 py-3 text-right lg:table-cell">
                Limite anual
              </th>
              <th className="px-4 py-3 text-center">Confianza</th>
              <th className="w-10 px-2 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {coverages.map((cov) => {
              const amount = toNumber(cov.coveredAmount);
              const limitPerEvent = toNumber(cov.limitPerEvent);
              const limitAnnual = toNumber(cov.limitAnnual);
              const currency = cov.currency ?? "CLP";

              return (
                <tr key={cov.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{cov.name}</p>
                    {cov.description && (
                      <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
                        {cov.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {amount !== null
                      ? formatCurrency(amount, currency)
                      : "---"}
                  </td>
                  <td className="hidden px-4 py-3 text-right text-gray-700 sm:table-cell">
                    {cov.coveredPercent !== null && cov.coveredPercent !== undefined
                      ? `${cov.coveredPercent}%`
                      : "---"}
                  </td>
                  <td className="hidden px-4 py-3 text-right text-gray-700 md:table-cell">
                    {limitPerEvent !== null
                      ? formatCurrency(limitPerEvent, currency)
                      : "---"}
                  </td>
                  <td className="hidden px-4 py-3 text-right text-gray-700 lg:table-cell">
                    {limitAnnual !== null
                      ? formatCurrency(limitAnnual, currency)
                      : "---"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ConfidenceBadge confidence={cov.confidence} />
                  </td>
                  <td className="px-2 py-3">
                    {cov.sourceText && (
                      <Tooltip>
                        <TooltipTrigger>
                          <MessageSquareText className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <p className="text-xs leading-relaxed">
                            {cov.sourceText}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
}
