"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  ShieldCheck,
  Clock,
  AlertTriangle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DashboardData } from "@/types/insurance";

interface StatsCardsProps {
  data?: DashboardData;
  isLoading?: boolean;
  className?: string;
}

interface StatCardConfig {
  label: string;
  icon: LucideIcon;
  getValue: (data: DashboardData) => number;
  iconBg: string;
  iconColor: string;
}

const STATS: StatCardConfig[] = [
  {
    label: "Total polizas",
    icon: FileText,
    getValue: (d) => d.totalPolicies,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    label: "Polizas activas",
    icon: ShieldCheck,
    getValue: (d) => d.activePolicies,
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    label: "Por vencer (30 dias)",
    icon: Clock,
    getValue: (d) => d.expiringPolicies,
    iconBg: "bg-yellow-50",
    iconColor: "text-yellow-600",
  },
  {
    label: "Vacios de cobertura",
    icon: AlertTriangle,
    getValue: (d) => d.coverageGaps.length,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
  },
];

export function StatsCards({ data, isLoading, className }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-2 gap-4 lg:grid-cols-4", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-4 lg:grid-cols-4", className)}>
      {STATS.map((stat) => {
        const value = data ? stat.getValue(data) : 0;

        return (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  stat.iconBg
                )}
              >
                <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
