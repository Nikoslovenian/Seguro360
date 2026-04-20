"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Library,
  Search,
  ChevronDown,
  ExternalLink,
  AlertTriangle,
  Heart,
  Shield,
  Car,
  Home,
  Zap,
  Loader2,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PolicyLibraryEntry {
  id: string;
  cmfCode: string | null;
  insuranceCompany: string;
  productName: string;
  category: string;
  ramo: string | null;
  summary: string | null;
  keyFeatures: string | null;
  standardCoverages: string | null;
  standardExclusions: string | null;
  typicalPremiumRange: string | null;
  source: string;
  isActive: boolean;
  createdAt: string;
}

interface LibraryApiResponse {
  success: boolean;
  data?: {
    items: PolicyLibraryEntry[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  error?: string;
}

// ─── Category → icon & color mapping ────────────────────────────────────────

const categoryConfig: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }
> = {
  SALUD: {
    icon: Heart,
    color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  },
  VIDA: {
    icon: Shield,
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  VEHICULO: {
    icon: Car,
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  HOGAR: {
    icon: Home,
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  ACCIDENTES: {
    icon: Zap,
    color: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  },
};

const defaultCategoryConfig = {
  icon: Shield,
  color: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

function getCategoryConfig(category: string) {
  return categoryConfig[category] ?? defaultCategoryConfig;
}

// ─── Static filter options ──────────────────────────────────────────────────

const categories = ["all", "SALUD", "VIDA", "VEHICULO", "HOGAR", "ACCIDENTES"];

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");

  const [entries, setEntries] = useState<PolicyLibraryEntry[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Collect unique companies from fetched entries for the company dropdown
  const [knownCompanies, setKnownCompanies] = useState<string[]>([]);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (companyFilter !== "all") params.set("company", companyFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      params.set("page", "1");
      params.set("pageSize", "50");

      const res = await fetch(`/api/library?${params.toString()}`);
      const json: LibraryApiResponse = await res.json();

      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error ?? "Error al cargar la biblioteca");
      }

      setEntries(json.data.items);
      setTotalResults(json.data.total);

      // Build unique companies from results (first load gets all, since no filters)
      if (categoryFilter === "all" && companyFilter === "all" && !searchQuery.trim()) {
        const uniqueCompanies = Array.from(
          new Set(json.data.items.map((e) => e.insuranceCompany))
        ).sort();
        setKnownCompanies(uniqueCompanies);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setEntries([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter, companyFilter]);

  // Fetch on mount and when filters change (debounce search)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEntries();
    }, searchQuery ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchEntries, searchQuery]);

  // Also do an initial unfiltered fetch to populate the company dropdown
  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await fetch("/api/library?page=1&pageSize=100");
        const json: LibraryApiResponse = await res.json();
        if (json.success && json.data) {
          const uniqueCompanies = Array.from(
            new Set(json.data.items.map((e) => e.insuranceCompany))
          ).sort();
          setKnownCompanies(uniqueCompanies);
        }
      } catch {
        // Non-critical, dropdown just won't have all companies
      }
    }
    loadCompanies();
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 -m-6 p-6 min-h-full bg-[#0f1117]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500">
          <Library className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#e2e8f0]">
            Biblioteca de Polizas
          </h1>
          <p className="text-sm text-[#94a3b8]">
            Polizas modelo y referenciales del mercado chileno
          </p>
        </div>
      </div>

      {/* Disclaimer banner */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <p className="text-sm text-amber-200">
            Las polizas modelo son referenciales. No reemplazan la poliza
            contratada por el asegurado. Consulte siempre su poliza vigente
            para conocer las condiciones exactas de su cobertura.
          </p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, compania o descripcion..."
            className="w-full rounded-xl border border-[#2d3548] bg-[#1c2333] pl-11 pr-4 py-3 text-sm text-[#e2e8f0] placeholder-[#94a3b8]/50 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
          />
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none rounded-xl border border-[#2d3548] bg-[#1c2333] pl-4 pr-10 py-2.5 text-sm text-[#e2e8f0] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors cursor-pointer"
            >
              <option value="all">Todas las categorias</option>
              {categories.slice(1).map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0) + cat.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="appearance-none rounded-xl border border-[#2d3548] bg-[#1c2333] pl-4 pr-10 py-2.5 text-sm text-[#e2e8f0] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors cursor-pointer"
            >
              <option value="all">Todas las companias</option>
              {knownCompanies.map((comp) => (
                <option key={comp} value={comp}>
                  {comp}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
          </div>

          <span className="flex items-center text-xs text-[#94a3b8]">
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <>
                {totalResults} resultado
                {totalResults !== 1 ? "s" : ""}
              </>
            )}
          </span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-400 mb-2" />
          <p className="text-sm text-red-300 mb-3">{error}</p>
          <button
            onClick={fetchEntries}
            className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !error && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-5 animate-pulse"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-[#0f1117]" />
                <div className="h-5 w-20 rounded-full bg-[#0f1117]" />
              </div>
              <div className="h-3 w-24 rounded bg-[#0f1117] mb-2" />
              <div className="h-5 w-48 rounded bg-[#0f1117] mb-2" />
              <div className="h-3 w-36 rounded bg-[#0f1117] mb-3" />
              <div className="space-y-1.5 mb-4">
                <div className="h-3 w-full rounded bg-[#0f1117]" />
                <div className="h-3 w-4/5 rounded bg-[#0f1117]" />
              </div>
              <div className="h-9 w-28 rounded-lg bg-[#0f1117]" />
            </div>
          ))}
        </div>
      )}

      {/* Card grid */}
      {!loading && !error && entries.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => {
            const config = getCategoryConfig(entry.category);
            const Icon = config.icon;
            return (
              <div
                key={entry.id}
                className="group rounded-2xl border border-[#2d3548] bg-[#1c2333] p-5 transition-all hover:border-[#3d4a63] hover:shadow-lg hover:shadow-black/20"
              >
                {/* Category badge and icon */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f1117]">
                    <Icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.color}`}
                  >
                    {entry.category}
                  </span>
                </div>

                {/* Company */}
                <p className="text-xs text-[#94a3b8] mb-1">
                  {entry.insuranceCompany}
                </p>

                {/* Product name */}
                <h3 className="text-base font-semibold text-[#e2e8f0] mb-2">
                  {entry.productName}
                </h3>

                {/* Reference label */}
                <p className="text-xs text-[#94a3b8]/60 italic mb-3">
                  Poliza modelo / referencial
                </p>

                {/* Description */}
                <p className="text-sm text-[#94a3b8] leading-relaxed mb-4 line-clamp-3">
                  {entry.summary ?? "Sin descripcion disponible."}
                </p>

                {/* Action */}
                <Link
                  href={`/library/${entry.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#2d3548] bg-[#0f1117] px-4 py-2 text-sm font-medium text-[#e2e8f0] transition-all hover:border-blue-500/50 hover:text-blue-400 group-hover:border-blue-500/30"
                >
                  Ver detalle
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && entries.length === 0 && (
        <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-12 text-center">
          <Search className="mx-auto h-10 w-10 text-[#94a3b8]/30 mb-3" />
          <p className="text-sm text-[#94a3b8]">
            No se encontraron polizas con los filtros seleccionados.
          </p>
        </div>
      )}
    </div>
  );
}
