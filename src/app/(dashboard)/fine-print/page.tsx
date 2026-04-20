"use client";

import { useState, useEffect } from "react";
import {
  Eye,
  ShieldOff,
  Clock,
  BarChart3,
  Settings2,
  FileText,
  Timer,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  Upload,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ClauseCategory = "exclusion" | "carencia" | "tope" | "ajuste";
type ClauseSeverity = "critica" | "alta" | "media" | "baja";
type ClauseImpact = "alto" | "medio" | "bajo";

interface DetectedClause {
  id: string;
  category: ClauseCategory;
  severity: ClauseSeverity;
  policy: string;
  company: string;
  text: string;
  pageRef?: string;
  sectionRef?: string;
  confidence: number; // 0-100
  impact: ClauseImpact;
  // For carencias
  carenciaStart?: string;
  carenciaEnd?: string;
  carenciaCumplida?: boolean;
  // For topes
  usagePercent?: number;
  topeAmount?: string;
}

// ─── API Types ──────────────────────────────────────────────────────────────

interface ApiExclusion {
  id: string;
  description: string;
  category?: string | null;
  isAbsolute: boolean;
  confidence?: number | null;
  sourceText?: string | null;
  sourcePage?: number | null;
}

interface ApiDeductible {
  id: string;
  name: string;
  amount?: number | null;
  percentage?: number | null;
  currency: string;
  appliesTo?: string | null;
  frequency?: string | null;
  confidence?: number | null;
  sourceText?: string | null;
  sourcePage?: number | null;
}

interface ApiBenefitLimit {
  id: string;
  name: string;
  limitType: string;
  amount?: number | null;
  percentage?: number | null;
  currency: string;
  maxUnits?: number | null;
  unitType?: string | null;
  period?: string | null;
  confidence?: number | null;
  sourceText?: string | null;
  sourcePage?: number | null;
}

interface ApiWaitingPeriod {
  id: string;
  condition: string;
  durationDays: number;
  startDate?: string | null;
  endDate?: string | null;
  confidence?: number | null;
  sourceText?: string | null;
  sourcePage?: number | null;
}

interface ApiPolicyFull {
  id: string;
  policyNumber?: string | null;
  insuranceCompany?: string | null;
  category: string;
  subcategory?: string | null;
  ramo?: string | null;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  exclusions: ApiExclusion[];
  deductibles: ApiDeductible[];
  benefitLimits: ApiBenefitLimit[];
  waitingPeriods: ApiWaitingPeriod[];
}

// ─── Build clauses from real policy data ─────────────────────────────────────

function formatCLP(amount: number): string {
  return "$" + amount.toLocaleString("es-CL");
}

function buildClausesFromPolicy(policy: ApiPolicyFull): DetectedClause[] {
  const clauses: DetectedClause[] = [];
  const company = policy.insuranceCompany ?? "Aseguradora";
  const policyName = policy.ramo ?? policy.subcategory ?? policy.category;

  // 1. Exclusions -> "exclusion" category
  for (const exc of policy.exclusions) {
    const severity: ClauseSeverity = exc.isAbsolute ? "critica" : "alta";
    const impact: ClauseImpact = exc.isAbsolute ? "alto" : "medio";

    clauses.push({
      id: `exc-${exc.id}`,
      category: "exclusion",
      severity,
      policy: policyName,
      company,
      text: exc.description,
      pageRef: exc.sourcePage ? `Pagina ${exc.sourcePage}` : undefined,
      confidence: exc.confidence != null ? Math.round(exc.confidence * 100) : 85,
      impact,
    });
  }

  // 2. Waiting periods -> "carencia" category
  for (const wp of policy.waitingPeriods) {
    const now = new Date();
    let carenciaCumplida = false;
    let carenciaStart: string | undefined;
    let carenciaEnd: string | undefined;

    if (wp.startDate) {
      carenciaStart = new Date(wp.startDate).toLocaleDateString("es-CL");
    } else if (policy.startDate) {
      carenciaStart = new Date(policy.startDate).toLocaleDateString("es-CL");
    }

    if (wp.endDate) {
      const endDate = new Date(wp.endDate);
      carenciaEnd = endDate.toLocaleDateString("es-CL");
      carenciaCumplida = endDate <= now;
    } else if (wp.startDate || policy.startDate) {
      const start = new Date(wp.startDate ?? policy.startDate!);
      const end = new Date(start.getTime() + wp.durationDays * 24 * 60 * 60 * 1000);
      carenciaEnd = end.toLocaleDateString("es-CL");
      carenciaCumplida = end <= now;
    }

    const severity: ClauseSeverity = carenciaCumplida ? "media" : "alta";
    const impact: ClauseImpact = wp.durationDays > 90 ? "alto" : "medio";

    clauses.push({
      id: `car-${wp.id}`,
      category: "carencia",
      severity,
      policy: policyName,
      company,
      text: `Carencia de ${wp.durationDays} dias para ${wp.condition}`,
      pageRef: wp.sourcePage ? `Pagina ${wp.sourcePage}` : undefined,
      confidence: wp.confidence != null ? Math.round(wp.confidence * 100) : 85,
      impact,
      carenciaStart,
      carenciaEnd,
      carenciaCumplida,
    });
  }

  // 3. Benefit limits -> "tope" category
  for (const bl of policy.benefitLimits) {
    let text = bl.name;
    let topeAmount: string | undefined;

    if (bl.amount != null) {
      topeAmount = formatCLP(bl.amount);
      text = `${bl.name}: ${topeAmount}`;
      if (bl.period) text += ` (${bl.period})`;
    } else if (bl.percentage != null) {
      text = `${bl.name}: ${bl.percentage}%`;
    } else if (bl.maxUnits != null) {
      text = `${bl.name}: maximo ${bl.maxUnits} ${bl.unitType ?? "unidades"}`;
      if (bl.period) text += ` por ${bl.period}`;
    }

    const impact: ClauseImpact =
      bl.limitType === "CAP" || bl.limitType === "MAXIMUM_DAYS"
        ? "alto"
        : bl.limitType === "COPAY"
          ? "medio"
          : "medio";

    clauses.push({
      id: `top-${bl.id}`,
      category: "tope",
      severity: impact === "alto" ? "alta" : "media",
      policy: policyName,
      company,
      text,
      pageRef: bl.sourcePage ? `Pagina ${bl.sourcePage}` : undefined,
      confidence: bl.confidence != null ? Math.round(bl.confidence * 100) : 85,
      impact,
      topeAmount,
    });
  }

  // 4. Deductibles -> "tope" category (deductibles are effectively limits/out-of-pocket)
  for (const ded of policy.deductibles) {
    let text = ded.name;
    let topeAmount: string | undefined;

    if (ded.amount != null) {
      topeAmount = formatCLP(ded.amount);
      text = `Deducible: ${ded.name} - ${topeAmount}`;
    } else if (ded.percentage != null) {
      text = `Deducible: ${ded.name} - ${ded.percentage}%`;
    }

    if (ded.appliesTo) text += ` (${ded.appliesTo})`;
    if (ded.frequency) text += ` [${ded.frequency}]`;

    clauses.push({
      id: `ded-${ded.id}`,
      category: "tope",
      severity: "media",
      policy: policyName,
      company,
      text,
      pageRef: ded.sourcePage ? `Pagina ${ded.sourcePage}` : undefined,
      confidence: ded.confidence != null ? Math.round(ded.confidence * 100) : 85,
      impact: "medio",
      topeAmount,
    });
  }

  return clauses;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCategoryConfig(category: ClauseCategory) {
  switch (category) {
    case "exclusion":
      return {
        label: "Exclusiones Criticas",
        shortLabel: "Exclusiones",
        color: "red",
        icon: <ShieldOff className="w-5 h-5" />,
        bgClass: "bg-red-500/15 text-red-400 border-red-500/30",
        dotClass: "bg-red-500",
        headerBg: "bg-red-500/10 border-red-500/20",
      };
    case "carencia":
      return {
        label: "Carencias Activas",
        shortLabel: "Carencias",
        color: "amber",
        icon: <Timer className="w-5 h-5" />,
        bgClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        dotClass: "bg-amber-500",
        headerBg: "bg-amber-500/10 border-amber-500/20",
      };
    case "tope":
      return {
        label: "Topes y Limites",
        shortLabel: "Topes",
        color: "blue",
        icon: <BarChart3 className="w-5 h-5" />,
        bgClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        dotClass: "bg-blue-500",
        headerBg: "bg-blue-500/10 border-blue-500/20",
      };
    case "ajuste":
      return {
        label: "Clausulas de Ajuste",
        shortLabel: "Ajustes",
        color: "purple",
        icon: <Settings2 className="w-5 h-5" />,
        bgClass: "bg-purple-500/15 text-purple-400 border-purple-500/30",
        dotClass: "bg-purple-500",
        headerBg: "bg-purple-500/10 border-purple-500/20",
      };
  }
}

function getImpactBadge(impact: ClauseImpact) {
  switch (impact) {
    case "alto":
      return "bg-red-500/15 text-red-400 border border-red-500/30";
    case "medio":
      return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
    case "bajo":
      return "bg-green-500/15 text-green-400 border border-green-500/30";
  }
}

function getImpactLabel(impact: ClauseImpact) {
  switch (impact) {
    case "alto":
      return "Impacto Alto";
    case "medio":
      return "Impacto Medio";
    case "bajo":
      return "Impacto Bajo";
  }
}

function getUsageBarColor(percent: number): string {
  if (percent >= 75) return "bg-red-500";
  if (percent >= 50) return "bg-amber-500";
  return "bg-emerald-500";
}

function getConfidenceBadge(confidence: number) {
  if (confidence >= 95)
    return {
      label: `${confidence}% confianza`,
      className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    };
  if (confidence >= 85)
    return {
      label: `${confidence}% confianza`,
      className: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    };
  return {
    label: `${confidence}% confianza`,
    className: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  };
}

// ─── Risk Gauge (simplified) ─────────────────────────────────────────────────

function RiskGauge({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 300);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = 70;
  const strokeWidth = 10;
  const center = 85;
  const circumference = 2 * Math.PI * radius;
  const startAngle = 135;
  const totalArc = 270;
  const arcLength = (totalArc / 360) * circumference;
  const filledLength = (animated / 100) * arcLength;

  const color =
    score >= 70
      ? "#ef4444"
      : score >= 45
        ? "#f59e0b"
        : score >= 20
          ? "#3b82f6"
          : "#22c55e";

  const label =
    score >= 70
      ? "Riesgo Alto"
      : score >= 45
        ? "Riesgo Medio"
        : score >= 20
          ? "Riesgo Bajo"
          : "Riesgo Minimo";

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="170" height="170" viewBox="0 0 170 170">
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#2d3548"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform={`rotate(${startAngle} ${center} ${center})`}
          />
          {/* Filled arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${filledLength} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform={`rotate(${startAngle} ${center} ${center})`}
            style={{
              transition: "stroke-dasharray 1s ease-out, stroke 0.5s ease",
              filter: `drop-shadow(0 0 6px ${color}80)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-3xl font-bold transition-colors duration-500"
            style={{ color }}
          >
            {animated}
          </span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">
            /100
          </span>
        </div>
      </div>
      <p className="text-sm font-semibold mt-1" style={{ color }}>
        {label}
      </p>
      <p className="text-[11px] text-slate-500 mt-0.5">
        Nivel de riesgo de letra chica
      </p>
    </div>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function FinePrintSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30">
          <Eye className="w-7 h-7 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            Verificador de Letra Chica
          </h1>
          <p className="text-sm text-slate-400">
            Analizando clausulas de tus polizas...
          </p>
        </div>
      </div>

      {/* Summary skeleton */}
      <div className="bg-[#1c2333] border border-[#2d3548] rounded-xl p-6">
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
          <p className="text-sm text-slate-400">Cargando detalles de polizas...</p>
        </div>
      </div>

      {/* Card skeletons */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-[#1c2333] border border-[#2d3548] rounded-xl p-4 animate-pulse"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-700" />
              <div className="flex-1">
                <div className="w-32 h-3 bg-slate-700 rounded mb-2" />
                <div className="w-full h-4 bg-slate-700 rounded mb-1" />
                <div className="w-24 h-3 bg-slate-800 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function FinePrintPage() {
  const [clauses, setClauses] = useState<DetectedClause[]>([]);
  const [filter, setFilter] = useState<"all" | ClauseCategory>("all");
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [noPolicies, setNoPolicies] = useState(false);

  // Fetch policies and build clauses from real data
  useEffect(() => {
    let cancelled = false;

    async function fetchPolicyDetails() {
      try {
        // Step 1: get the list of policies
        const listRes = await fetch("/api/policies?pageSize=100");
        if (!listRes.ok) throw new Error("Failed to fetch policies");
        const listJson = await listRes.json();

        if (cancelled) return;

        if (!listJson.success || !listJson.data?.items?.length) {
          setNoPolicies(true);
          setLoading(false);
          return;
        }

        const policyIds: string[] = listJson.data.items.map((p: { id: string }) => p.id);

        // Step 2: fetch each policy's full details (with exclusions, deductibles, etc.)
        const detailPromises = policyIds.map(async (id: string) => {
          try {
            const res = await fetch(`/api/policies/${id}`);
            if (!res.ok) return null;
            const json = await res.json();
            return json.success ? json.data : null;
          } catch {
            return null;
          }
        });

        const detailResults = await Promise.all(detailPromises);
        if (cancelled) return;

        const validPolicies = detailResults.filter(Boolean) as ApiPolicyFull[];

        // Step 3: build clauses from all policies
        const allClauses: DetectedClause[] = [];
        for (const policy of validPolicies) {
          allClauses.push(...buildClausesFromPolicy(policy));
        }

        // Sort: critica first, then alta, media, baja
        const severityOrder: Record<string, number> = {
          critica: 0,
          alta: 1,
          media: 2,
          baja: 3,
        };
        allClauses.sort(
          (a, b) => (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99),
        );

        setClauses(allClauses);

        if (allClauses.length === 0) {
          // Policies exist but no clauses extracted
          setNoPolicies(false);
        }

        setLoading(false);
        setTimeout(() => setLoaded(true), 100);
      } catch (err) {
        console.error("Error fetching policy details:", err);
        if (!cancelled) {
          setNoPolicies(true);
          setLoading(false);
        }
      }
    }

    fetchPolicyDetails();
    return () => {
      cancelled = true;
    };
  }, []);

  // Loading state
  if (loading) {
    return <FinePrintSkeleton />;
  }

  // Empty state: no policies uploaded
  if (noPolicies) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30">
            <Eye className="w-7 h-7 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Verificador de Letra Chica
            </h1>
            <p className="text-sm text-slate-400">
              Clausulas criticas detectadas en tus polizas
            </p>
          </div>
        </div>

        <div className="bg-[#1c2333] border border-[#2d3548] rounded-xl p-12 text-center">
          <Upload className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            No tienes polizas cargadas
          </h2>
          <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
            Sube tus documentos de seguro para que podamos analizar exclusiones,
            carencias, topes y clausulas de ajuste automaticamente.
          </p>
          <a
            href="/documents"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:brightness-125"
            style={{
              background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
              color: "#ffffff",
            }}
          >
            <FileText className="w-4 h-4" />
            Subir documentos
          </a>
        </div>
      </div>
    );
  }

  // ── Computed stats ──
  const exclusionCount = clauses.filter(
    (c) => c.category === "exclusion",
  ).length;
  const carenciaActiveCount = clauses.filter(
    (c) => c.category === "carencia" && !c.carenciaCumplida,
  ).length;
  const topesRisk = clauses.filter(
    (c) => c.category === "tope" && c.usagePercent !== undefined && c.usagePercent >= 30,
  ).length;
  const totalClauses = clauses.length;

  // Risk score: weighted by severity and impact
  const riskScore = Math.min(
    100,
    Math.round(
      (exclusionCount * 8 + carenciaActiveCount * 10 + topesRisk * 6 + clauses.filter((c) => c.impact === "alto").length * 4) * 1.2,
    ),
  );

  // ── Filtered clauses ──
  const filteredClauses =
    filter === "all"
      ? clauses
      : clauses.filter((c) => c.category === filter);

  // Group by category for display
  const categories: ClauseCategory[] = [
    "exclusion",
    "carencia",
    "tope",
    "ajuste",
  ];
  const groupedClauses = categories
    .map((cat) => ({
      category: cat,
      config: getCategoryConfig(cat),
      clauses: filteredClauses.filter((c) => c.category === cat),
    }))
    .filter((g) => g.clauses.length > 0);

  return (
    <div
      className={`space-y-6 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30">
          <Eye className="w-7 h-7 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            Verificador de Letra Chica
          </h1>
          <p className="text-sm text-slate-400">
            Clausulas criticas detectadas en tus polizas
          </p>
        </div>
      </div>

      {/* ── Summary Panel ── */}
      <div className="bg-[#1c2333] border border-[#2d3548] rounded-xl p-6">
        {totalClauses === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-lg font-semibold text-emerald-400 mb-1">
              Sin clausulas criticas detectadas
            </p>
            <p className="text-sm text-slate-400">
              Tus polizas no contienen exclusiones, carencias o topes que hayamos podido extraer automaticamente.
              Esto puede significar que los documentos aun no han sido procesados completamente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
            {/* Stats */}
            <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="p-2 rounded-lg bg-slate-500/20">
                    <FileText className="w-5 h-5 text-slate-300" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{totalClauses}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Clausulas detectadas
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <ShieldOff className="w-5 h-5 text-red-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-red-400">
                  {exclusionCount}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Exclusiones criticas
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <Timer className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-amber-400">
                  {carenciaActiveCount}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Carencias activas
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-blue-400">{topesRisk}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Topes en riesgo
                </p>
              </div>
            </div>

            {/* Risk Gauge */}
            <div className="lg:col-span-2 flex justify-center">
              <RiskGauge score={riskScore} />
            </div>
          </div>
        )}
      </div>

      {/* ── Filter Tabs ── */}
      {totalClauses > 0 && (
        <div className="flex gap-1 bg-[#1c2333] border border-[#2d3548] rounded-xl p-1 overflow-x-auto">
          {(
            [
              { key: "all" as const, label: "Todas", count: totalClauses },
              {
                key: "exclusion" as const,
                label: "Exclusiones",
                count: clauses.filter((c) => c.category === "exclusion").length,
              },
              {
                key: "carencia" as const,
                label: "Carencias",
                count: clauses.filter((c) => c.category === "carencia").length,
              },
              {
                key: "tope" as const,
                label: "Topes",
                count: clauses.filter((c) => c.category === "tope").length,
              },
              {
                key: "ajuste" as const,
                label: "Ajustes",
                count: clauses.filter((c) => c.category === "ajuste").length,
              },
            ] as const
          ).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                filter === key
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              {label}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  filter === key
                    ? "bg-white/15 text-white"
                    : "bg-slate-700 text-slate-400"
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Clause Groups ── */}
      <div className="space-y-6">
        {groupedClauses.map((group) => (
          <div key={group.category}>
            {/* Group header */}
            <div
              className={`flex items-center gap-3 mb-3 px-4 py-2.5 rounded-xl border ${group.config.headerBg}`}
            >
              <div className={group.config.bgClass + " p-1.5 rounded-lg border"}>
                {group.config.icon}
              </div>
              <h2
                className={`text-base font-bold ${
                  group.config.color === "red"
                    ? "text-red-400"
                    : group.config.color === "amber"
                      ? "text-amber-400"
                      : group.config.color === "blue"
                        ? "text-blue-400"
                        : "text-purple-400"
                }`}
              >
                {group.config.label}
              </h2>
              <span className="text-xs text-slate-500">
                ({group.clauses.length}{" "}
                {group.clauses.length === 1 ? "clausula" : "clausulas"})
              </span>
            </div>

            {/* Clause cards */}
            <div className="space-y-2">
              {group.clauses.map((clause, idx) => {
                const confidenceBadge = getConfidenceBadge(clause.confidence);
                return (
                  <div
                    key={clause.id}
                    className="bg-[#1c2333] border border-[#2d3548] rounded-xl overflow-hidden hover:border-slate-500/50 transition-all duration-200"
                    style={{
                      animation: loaded
                        ? `fadeSlideIn 0.35s ease-out ${idx * 50}ms both`
                        : "none",
                    }}
                  >
                    <div className="p-4">
                      {/* Top row: icon + policy info + badges */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-start gap-3">
                          {/* Severity dot + icon */}
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${group.config.dotClass}`}
                            />
                            <div
                              className={`p-1.5 rounded-lg border ${group.config.bgClass}`}
                            >
                              {group.config.icon}
                            </div>
                          </div>

                          <div className="min-w-0">
                            {/* Policy + company */}
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-xs font-semibold text-slate-300">
                                {clause.company}
                              </span>
                              <span className="text-[10px] text-slate-600">
                                |
                              </span>
                              <span className="text-xs text-slate-500">
                                {clause.policy}
                              </span>
                            </div>

                            {/* Clause text */}
                            <p className="text-sm text-white font-medium leading-relaxed">
                              {clause.text}
                            </p>

                            {/* Page / section reference */}
                            {(clause.pageRef || clause.sectionRef) && (
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                {clause.pageRef && (
                                  <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                                    {clause.pageRef}
                                  </span>
                                )}
                                {clause.sectionRef && (
                                  <span className="text-[10px] text-slate-600">
                                    {clause.sectionRef}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Carencia info */}
                            {clause.category === "carencia" && (
                              <div className="mt-2">
                                {clause.carenciaCumplida ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Cumplida
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-2 text-xs">
                                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                                    <span className="text-slate-400">
                                      Inicio: {clause.carenciaStart}
                                    </span>
                                    <span className="text-slate-600">→</span>
                                    <span className="text-amber-400 font-semibold">
                                      Vence: {clause.carenciaEnd}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Tope usage bar */}
                            {clause.category === "tope" &&
                              clause.usagePercent !== undefined && (
                                <div className="mt-2 max-w-xs">
                                  <div className="flex items-center justify-between text-[10px] mb-1">
                                    <span className="text-slate-500">
                                      Uso estimado
                                    </span>
                                    <span className="text-slate-300 font-semibold">
                                      {clause.usagePercent}%
                                      {clause.topeAmount &&
                                        ` de ${clause.topeAmount}`}
                                    </span>
                                  </div>
                                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-1000 ease-out ${getUsageBarColor(
                                        clause.usagePercent,
                                      )}`}
                                      style={{
                                        width: loaded
                                          ? `${clause.usagePercent}%`
                                          : "0%",
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>

                        {/* Right side badges */}
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          {/* Impact badge */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getImpactBadge(
                              clause.impact,
                            )}`}
                          >
                            {getImpactLabel(clause.impact)}
                          </span>

                          {/* Confidence badge */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${confidenceBadge.className}`}
                          >
                            {confidenceBadge.label}
                          </span>

                          {/* "Ver en documento" link */}
                          <button className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors mt-1">
                            <FileText className="w-3 h-3" />
                            Ver en documento
                            <ArrowUpRight className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state for filtered view */}
      {filteredClauses.length === 0 && totalClauses > 0 && (
        <div className="bg-[#1c2333] border border-[#2d3548] rounded-xl p-12 text-center">
          <Eye className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">
            No hay clausulas con este filtro
          </p>
          <p className="text-slate-500 text-sm mt-1">
            Selecciona otra categoria para ver mas clausulas
          </p>
        </div>
      )}

      {/* Keyframe animation */}
      <style jsx global>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
