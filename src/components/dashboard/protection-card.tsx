"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/ui/card";
import { INSURANCE_CATEGORIES, PROTECTION_LEVELS } from "@/lib/constants";
import type { ProtectionScore } from "@/types/insurance";
import type { InsuranceCategory } from "@prisma/client";
import {
  Heart,
  Shield,
  Home,
  Car,
  AlertTriangle,
  Hospital,
  HeartPulse,
  Scale,
  Plane,
  MoreHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Heart,
  Shield,
  Home,
  Car,
  AlertTriangle,
  Hospital,
  HeartPulse,
  Scale,
  Plane,
  MoreHorizontal,
};

const LEVEL_DOT: Record<string, string> = {
  GREEN: "bg-green-500",
  YELLOW: "bg-yellow-500",
  RED: "bg-red-500",
};

interface ProtectionCardProps {
  score: ProtectionScore;
  className?: string;
}

export function ProtectionCard({ score, className }: ProtectionCardProps) {
  const router = useRouter();
  const config = INSURANCE_CATEGORIES[score.category];
  const levelConfig = PROTECTION_LEVELS[score.level];
  const Icon = ICON_MAP[config.icon] ?? Shield;

  const statusText =
    score.activePolicies === 0
      ? "Sin polizas activas"
      : score.activePolicies === 1
        ? "1 poliza activa"
        : `${score.activePolicies} polizas activas`;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-shadow hover:shadow-md",
        className
      )}
      onClick={() =>
        router.push(`/policies?category=${score.category}`)
      }
    >
      <CardContent className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            levelConfig.bg
          )}
        >
          <Icon className={cn("h-5 w-5", levelConfig.color)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-gray-900">
              {config.label}
            </span>
            <span
              className={cn(
                "inline-block h-2.5 w-2.5 shrink-0 rounded-full",
                LEVEL_DOT[score.level]
              )}
              title={levelConfig.label}
            />
          </div>
          <p className="mt-0.5 text-xs text-gray-500">{statusText}</p>
          <p className={cn("mt-0.5 text-xs", levelConfig.color)}>
            {levelConfig.label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
