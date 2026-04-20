"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { INSURANCE_CATEGORIES } from "@/lib/constants";
import { Calendar, ChevronRight } from "lucide-react";
import type { InsuranceCategory } from "@/types/prisma-enums";
import type { ApiResponse, PaginatedResponse } from "@/types/api";

interface ExpiringPolicy {
  id: string;
  policyNumber: string | null;
  insuranceCompany: string | null;
  category: InsuranceCategory;
  endDate: string;
}

interface ExpiryTimelineProps {
  className?: string;
}

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getDaysColor(days: number): string {
  if (days <= 7) return "text-red-600 bg-red-50";
  if (days <= 14) return "text-yellow-600 bg-yellow-50";
  if (days <= 30) return "text-blue-600 bg-blue-50";
  return "text-gray-600 bg-gray-50";
}

export function ExpiryTimeline({ className }: ExpiryTimelineProps) {
  const router = useRouter();

  const { data, isLoading } = useQuery<
    ApiResponse<PaginatedResponse<ExpiringPolicy>>
  >({
    queryKey: ["expiring-policies"],
    queryFn: async () => {
      const res = await fetch(
        "/api/policies?status=ACTIVE&sortBy=endDate&sortOrder=asc&pageSize=10"
      );
      if (!res.ok) throw new Error("Error al cargar polizas");
      return res.json();
    },
  });

  const policies = (data?.data?.items ?? []).filter(
    (p) => p.endDate && getDaysRemaining(p.endDate) > 0 && getDaysRemaining(p.endDate) <= 90
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Proximos vencimientos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : policies.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-gray-500">
              No hay polizas por vencer en los proximos 90 dias
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {policies.map((policy) => {
              const days = getDaysRemaining(policy.endDate);
              const daysColor = getDaysColor(days);
              const catConfig = INSURANCE_CATEGORIES[policy.category];
              const formattedDate = new Date(policy.endDate).toLocaleDateString(
                "es-CL",
                { day: "2-digit", month: "short" }
              );

              return (
                <div
                  key={policy.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50"
                  onClick={() => router.push(`/policies/${policy.id}`)}
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        days <= 7
                          ? "bg-red-500"
                          : days <= 14
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                      )}
                    />
                  </div>

                  {/* Policy info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {policy.insuranceCompany ?? "Sin compania"}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {catConfig?.label ?? policy.category}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formattedDate}
                      </span>
                    </div>
                  </div>

                  {/* Days remaining */}
                  <div
                    className={cn(
                      "shrink-0 rounded-md px-2 py-1 text-xs font-medium",
                      daysColor
                    )}
                  >
                    {days} {days === 1 ? "dia" : "dias"}
                  </div>

                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
