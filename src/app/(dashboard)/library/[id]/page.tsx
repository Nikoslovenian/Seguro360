"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Building2,
  FileText,
  Loader2,
  Heart,
  Car,
  Home,
  Zap,
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

interface CoverageItem {
  name: string;
  description?: string;
  limit?: string;
}

interface LibraryDetailApiResponse {
  success: boolean;
  data?: PolicyLibraryEntry;
  error?: string;
}

// ─── Category styling ───────────────────────────────────────────────────────

const categoryStyles: Record<string, string> = {
  SALUD: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  VIDA: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  VEHICULO: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  HOGAR: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  ACCIDENTES: "bg-pink-500/20 text-pink-400 border-pink-500/30",
};

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  SALUD: Heart,
  VIDA: Shield,
  VEHICULO: Car,
  HOGAR: Home,
  ACCIDENTES: Zap,
};

// ─── JSON parsing helpers ───────────────────────────────────────────────────

function safeParseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

interface LibraryDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function LibraryDetailPage({ params }: LibraryDetailPageProps) {
  const { id } = use(params);

  const [entry, setEntry] = useState<PolicyLibraryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/library/${id}`);
        const json: LibraryDetailApiResponse = await res.json();

        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error ?? "Entrada no encontrada");
        }

        setEntry(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [id]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 -m-6 p-6 min-h-full bg-[#0f1117]">
        <Link
          href="/library"
          className="inline-flex items-center gap-2 text-sm text-[#94a3b8] hover:text-[#e2e8f0] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la biblioteca
        </Link>
        <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-12 text-center">
          <Loader2 className="h-8 w-8 text-blue-400 mx-auto mb-3 animate-spin" />
          <p className="text-sm text-[#94a3b8]">Cargando detalle...</p>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error || !entry) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 -m-6 p-6 min-h-full bg-[#0f1117]">
        <Link
          href="/library"
          className="inline-flex items-center gap-2 text-sm text-[#94a3b8] hover:text-[#e2e8f0] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la biblioteca
        </Link>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-12 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-400 mb-3" />
          <p className="text-sm text-red-300 mb-4">
            {error ?? "Entrada no encontrada"}
          </p>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a la biblioteca
          </Link>
        </div>
      </div>
    );
  }

  // ── Parse JSON fields ──
  const coverages = safeParseJson<CoverageItem[]>(entry.standardCoverages, []);
  const exclusions = safeParseJson<string[]>(entry.standardExclusions, []);
  const keyFeatures = safeParseJson<string[]>(entry.keyFeatures, []);
  const premiumRange = safeParseJson<Record<string, string>>(
    entry.typicalPremiumRange,
    {}
  );

  const categoryColor =
    categoryStyles[entry.category] ??
    "bg-slate-500/20 text-slate-400 border-slate-500/30";

  // ── Build general info items from available data ──
  const generalInfoItems: { label: string; value: string }[] = [];

  // From premiumRange JSON (may contain deductible, copay, etc.)
  if (premiumRange) {
    for (const [key, value] of Object.entries(premiumRange)) {
      if (typeof value === "string" && value.trim()) {
        // Try to make the key human readable
        const label = key
          .replace(/([A-Z])/g, " $1")
          .replace(/_/g, " ")
          .replace(/^\w/, (c) => c.toUpperCase())
          .trim();
        generalInfoItems.push({ label, value });
      }
    }
  }

  // Add metadata fields
  if (entry.ramo) {
    generalInfoItems.push({ label: "Ramo", value: entry.ramo });
  }
  if (entry.cmfCode) {
    generalInfoItems.push({ label: "Codigo CMF", value: entry.cmfCode });
  }
  if (entry.source) {
    generalInfoItems.push({
      label: "Fuente",
      value: entry.source.replace(/_/g, " "),
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 -m-6 p-6 min-h-full bg-[#0f1117]">
      {/* Back button */}
      <Link
        href="/library"
        className="inline-flex items-center gap-2 text-sm text-[#94a3b8] hover:text-[#e2e8f0] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a la biblioteca
      </Link>

      {/* Disclaimer */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <p className="text-sm text-amber-200">
            Esta es una poliza modelo referencial. No reemplaza la poliza
            contratada. Las condiciones reales pueden variar segun el plan
            contratado y las condiciones particulares de cada asegurado.
          </p>
        </div>
      </div>

      {/* Header card */}
      <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500">
            {(() => {
              const IconComp = categoryIcons[entry.category] ?? Shield;
              return <IconComp className="h-7 w-7 text-white" />;
            })()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${categoryColor}`}
              >
                {entry.category}
              </span>
              <span className="text-xs text-[#94a3b8]/60 italic">
                Poliza modelo / referencial
              </span>
            </div>
            <h1 className="text-xl font-bold text-[#e2e8f0] mb-1">
              {entry.productName}
            </h1>
            <p className="text-sm text-[#94a3b8] flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              {entry.insuranceCompany}
            </p>
            <p className="mt-3 text-sm text-[#94a3b8] leading-relaxed">
              {entry.summary ?? "Sin descripcion disponible."}
            </p>
          </div>
        </div>
      </div>

      {/* Key features (if any) */}
      {keyFeatures.length > 0 && (
        <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-6">
          <h2 className="text-lg font-semibold text-[#e2e8f0] flex items-center gap-2 mb-5">
            <Info className="h-5 w-5 text-blue-400" />
            Caracteristicas Principales
          </h2>
          <ul className="space-y-2">
            {keyFeatures.map((feature, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 text-sm text-[#94a3b8]"
              >
                <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Coberturas tipicas */}
      {coverages.length > 0 && (
        <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-6">
          <h2 className="text-lg font-semibold text-[#e2e8f0] flex items-center gap-2 mb-5">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            Coberturas Tipicas
          </h2>
          <div className="space-y-4">
            {coverages.map((cov, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#2d3548] bg-[#0f1117] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[#e2e8f0] mb-1">
                      {cov.name}
                    </h3>
                    {cov.description && (
                      <p className="text-sm text-[#94a3b8]">
                        {cov.description}
                      </p>
                    )}
                  </div>
                  {cov.limit && (
                    <span className="shrink-0 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-400 whitespace-nowrap">
                      {cov.limit}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exclusiones comunes */}
      {exclusions.length > 0 && (
        <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-6">
          <h2 className="text-lg font-semibold text-[#e2e8f0] flex items-center gap-2 mb-5">
            <XCircle className="h-5 w-5 text-red-400" />
            Exclusiones Comunes
          </h2>
          <div className="space-y-3">
            {exclusions.map((exc, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-xl border border-[#2d3548]/50 bg-[#0f1117] p-3"
              >
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                  <XCircle className="h-3 w-3 text-red-400" />
                </div>
                <p className="text-sm text-[#94a3b8]">{exc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Informacion general */}
      {generalInfoItems.length > 0 && (
        <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-6">
          <h2 className="text-lg font-semibold text-[#e2e8f0] flex items-center gap-2 mb-5">
            <Info className="h-5 w-5 text-blue-400" />
            Informacion General
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {generalInfoItems.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#2d3548] bg-[#0f1117] p-4"
              >
                <p className="text-xs text-[#94a3b8] mb-1">{item.label}</p>
                <p className="text-sm font-medium text-[#e2e8f0]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer disclaimer */}
      <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333]/50 p-4">
        <div className="flex gap-3">
          <FileText className="h-5 w-5 shrink-0 text-[#94a3b8] mt-0.5" />
          <p className="text-xs text-[#94a3b8]">
            La informacion presentada corresponde a condiciones tipicas del
            mercado asegurador chileno para este tipo de producto. Las
            condiciones especificas de su poliza pueden diferir. Consulte
            siempre su poliza vigente y la Superintendencia de Valores y
            Seguros (CMF) para informacion oficial.
          </p>
        </div>
      </div>
    </div>
  );
}
