"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Clock,
  Copy,
  Eye,
  Bell,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Alert } from "@/types/insurance";
import type { ApiResponse } from "@/types/api";

interface AlertsPanelProps {
  className?: string;
}

const ALERT_ICON: Record<Alert["type"], LucideIcon> = {
  expiring: Clock,
  gap: AlertTriangle,
  overlap: Copy,
  low_confidence: Eye,
  exclusion: AlertTriangle,
};

const SEVERITY_STYLES: Record<Alert["severity"], { border: string; icon: string; bg: string }> = {
  high: {
    border: "border-l-red-500",
    icon: "text-red-500",
    bg: "bg-red-50",
  },
  medium: {
    border: "border-l-yellow-500",
    icon: "text-yellow-500",
    bg: "bg-yellow-50",
  },
  low: {
    border: "border-l-blue-500",
    icon: "text-blue-500",
    bg: "bg-blue-50",
  },
};

export function AlertsPanel({ className }: AlertsPanelProps) {
  const router = useRouter();

  const { data, isLoading } = useQuery<ApiResponse<Alert[]>>({
    queryKey: ["dashboard-alerts"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/alerts");
      if (!res.ok) throw new Error("Error al cargar alertas");
      return res.json();
    },
  });

  const alerts = data?.data ?? [];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Alertas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
              <Bell className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-sm font-medium text-gray-700">
              No hay alertas activas
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Todo se ve bien con sus polizas
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => {
              const Icon = ALERT_ICON[alert.type] ?? AlertTriangle;
              const severity = SEVERITY_STYLES[alert.severity];

              return (
                <div
                  key={alert.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border-l-4 p-3 transition-colors hover:bg-gray-50",
                    severity.border
                  )}
                  onClick={() => {
                    if (alert.relatedPolicyId) {
                      router.push(`/policies/${alert.relatedPolicyId}`);
                    }
                  }}
                  role={alert.relatedPolicyId ? "link" : undefined}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      severity.bg
                    )}
                  >
                    <Icon className={cn("h-4 w-4", severity.icon)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {alert.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {alert.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
