"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils/cn";
import { ProtectionCard } from "@/components/dashboard/protection-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProtectionScore } from "@/types/insurance";
import type { ApiResponse } from "@/types/api";

interface ProtectionMapProps {
  className?: string;
}

export function ProtectionMap({ className }: ProtectionMapProps) {
  const { data, isLoading, error } = useQuery<ApiResponse<ProtectionScore[]>>({
    queryKey: ["protection-scores"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/protection-score");
      if (!res.ok) throw new Error("Error al cargar scores de proteccion");
      return res.json();
    },
  });

  const scores = data?.data ?? [];

  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-3", className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Error al cargar mapa de proteccion.
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-3", className)}>
      {scores.map((score) => (
        <ProtectionCard key={score.category} score={score} />
      ))}
    </div>
  );
}
