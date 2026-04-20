"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfidenceBadge } from "@/components/policies/confidence-badge";
import { INSURANCE_CATEGORIES } from "@/lib/constants";
import { Search, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import type { InsuranceCategory, PolicyStatus } from "@/types/prisma-enums";
import type { ApiResponse, PaginatedResponse } from "@/types/api";

interface PolicyListItem {
  id: string;
  policyNumber: string | null;
  insuranceCompany: string | null;
  category: InsuranceCategory;
  startDate: string | null;
  endDate: string | null;
  status: PolicyStatus;
  overallConfidence: number | null;
}

const STATUS_LABELS: Record<PolicyStatus, { label: string; color: string }> = {
  ACTIVE: { label: "Activa", color: "bg-green-50 text-green-700 border-green-200" },
  EXPIRED: { label: "Vencida", color: "bg-gray-100 text-gray-600 border-gray-200" },
  CANCELLED: { label: "Cancelada", color: "bg-red-50 text-red-700 border-red-200" },
  PENDING_VERIFICATION: {
    label: "Pendiente",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  DRAFT: { label: "Borrador", color: "bg-gray-50 text-gray-500 border-gray-200" },
};

const CATEGORY_OPTIONS: { value: InsuranceCategory; label: string }[] =
  Object.entries(INSURANCE_CATEGORIES).map(([value, { label }]) => ({
    value: value as InsuranceCategory,
    label,
  }));

const STATUS_OPTIONS: { value: PolicyStatus; label: string }[] = [
  { value: "ACTIVE", label: "Activa" },
  { value: "EXPIRED", label: "Vencida" },
  { value: "CANCELLED", label: "Cancelada" },
  { value: "PENDING_VERIFICATION", label: "Pendiente" },
  { value: "DRAFT", label: "Borrador" },
];

interface PolicyListProps {
  className?: string;
}

export function PolicyList({ className }: PolicyListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCategory = searchParams.get("category") as InsuranceCategory | null;

  const [category, setCategory] = useState<InsuranceCategory | "">(
    initialCategory ?? ""
  );
  const [status, setStatus] = useState<PolicyStatus | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("pageSize", String(pageSize));
  if (category) queryParams.set("category", category);
  if (status) queryParams.set("status", status);
  if (search) queryParams.set("search", search);

  const { data, isLoading } = useQuery<
    ApiResponse<PaginatedResponse<PolicyListItem>>
  >({
    queryKey: ["policies", category, status, search, page],
    queryFn: async () => {
      const res = await fetch(`/api/policies?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Error al cargar polizas");
      return res.json();
    },
  });

  const policies = data?.data?.items ?? [];
  const totalPages = data?.data?.totalPages ?? 0;
  const total = data?.data?.total ?? 0;

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setPage(1);
    },
    []
  );

  const formatDateRange = (start: string | null, end: string | null): string => {
    const opts: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "short",
      year: "numeric",
    };
    const startStr = start
      ? new Date(start).toLocaleDateString("es-CL", opts)
      : "---";
    const endStr = end
      ? new Date(end).toLocaleDateString("es-CL", opts)
      : "---";
    return `${startStr} - ${endStr}`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative min-w-0 flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por compania, numero o asegurado..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </form>

        <Select
          value={category}
          onValueChange={(val) => {
            setCategory(val as InsuranceCategory | "");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas las categorias</SelectItem>
            {CATEGORY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status}
          onValueChange={(val) => {
            setStatus(val as PolicyStatus | "");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los estados</SelectItem>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : policies.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Sin polizas"
          description="No se encontraron polizas con los filtros seleccionados. Suba documentos para extraer polizas automaticamente."
          actionLabel="Subir documentos"
          actionHref="/documents"
        />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Compania</th>
                <th className="hidden px-4 py-3 sm:table-cell">Numero</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="hidden px-4 py-3 md:table-cell">Vigencia</th>
                <th className="px-4 py-3">Estado</th>
                <th className="hidden px-4 py-3 lg:table-cell">Confianza</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {policies.map((policy) => {
                const catConfig = INSURANCE_CATEGORIES[policy.category];
                const statusConfig = STATUS_LABELS[policy.status];

                return (
                  <tr
                    key={policy.id}
                    onClick={() => router.push(`/policies/${policy.id}`)}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {policy.insuranceCompany ?? "Sin compania"}
                    </td>
                    <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">
                      {policy.policyNumber ?? "---"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">
                        {catConfig?.label ?? policy.category}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-gray-500 md:table-cell">
                      {formatDateRange(policy.startDate, policy.endDate)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={statusConfig?.color}
                      >
                        {statusConfig?.label ?? policy.status}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <ConfidenceBadge
                        confidence={policy.overallConfidence}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-gray-500">
                {total} poliza{total !== 1 ? "s" : ""} encontrada
                {total !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <span className="text-xs text-gray-500">
                  Pagina {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
