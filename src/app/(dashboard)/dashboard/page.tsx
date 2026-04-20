"use client";

import { useEffect, useState, useMemo } from "react";
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  ShieldOff,
  Heart,
  HeartPulse,
  Home,
  Car,
  Zap,
  Hospital,
  Accessibility,
  Scale,
  Plane,
  Package,
  Clock,
  FileCheck,
  MessageSquare,
  ArrowUpRight,
  TrendingUp,
  X,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { ProtectionScore, Alert } from "@/types/insurance";
import type { InsuranceCategory } from "@/types/prisma-enums";
import type { ApiResponse, PaginatedResponse } from "@/types/api";

/* ------------------------------------------------------------------ */
/*  TYPES                                                               */
/* ------------------------------------------------------------------ */

interface SubCoverage {
  name: string;
  amount: string;
  pct: number;
  color: string;
}

interface CategoryDetail {
  policyName: string;
  company: string;
  status: string;
  confidence: number;
  coverageAmount: string;
  subCoverages: SubCoverage[];
  note?: string;
}

interface ProtectionCategory {
  name: string;
  pct: number;
  policies: number;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  detail?: CategoryDetail;
  simpleMessage?: string;
}

interface StatCard {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  bgColor: string;
}

interface DonutSegment {
  label: string;
  pct: number;
  color: string;
}

interface CoverageBar {
  label: string;
  pct: number;
  color: string;
  gradEnd: string;
}

interface ActivityItem {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  text: string;
  time: string;
  color: string;
}

/* ------------------------------------------------------------------ */
/*  CATEGORY MAPPING                                                    */
/* ------------------------------------------------------------------ */

const CATEGORY_CONFIG: Record<
  InsuranceCategory,
  {
    name: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    color: string;
    gradEnd: string;
  }
> = {
  SALUD: { name: "Salud", icon: Heart, color: "#06b6d4", gradEnd: "#22d3ee" },
  VIDA: { name: "Vida", icon: HeartPulse, color: "#8b5cf6", gradEnd: "#a78bfa" },
  HOGAR: { name: "Hogar", icon: Home, color: "#f59e0b", gradEnd: "#fbbf24" },
  VEHICULO: { name: "Vehiculo", icon: Car, color: "#10b981", gradEnd: "#34d399" },
  ACCIDENTES: { name: "Accidentes", icon: Zap, color: "#ec4899", gradEnd: "#f472b6" },
  HOSPITALIZACION: { name: "Hospitalizacion", icon: Hospital, color: "#3b82f6", gradEnd: "#60a5fa" },
  INVALIDEZ: { name: "Invalidez", icon: Accessibility, color: "#ef4444", gradEnd: "#f87171" },
  RESPONSABILIDAD_CIVIL: { name: "Resp. Civil", icon: Scale, color: "#ef4444", gradEnd: "#f87171" },
  VIAJE: { name: "Viaje", icon: Plane, color: "#f97316", gradEnd: "#fb923c" },
  OTRO: { name: "Otro", icon: Package, color: "#ef4444", gradEnd: "#f87171" },
};

function levelToPercent(level: string, confidence: number): number {
  if (level === "GREEN") return Math.max(70, Math.round(confidence * 100));
  if (level === "YELLOW") return Math.max(40, Math.min(69, Math.round(confidence * 100) || 60));
  return 0;
}

function formatCLP(amount: number): string {
  if (amount === 0) return "$0";
  return "$" + amount.toLocaleString("es-CL") + " CLP";
}

/* ------------------------------------------------------------------ */
/*  ALERT -> ACTIVITY MAPPING                                           */
/* ------------------------------------------------------------------ */

function alertToActivity(alert: Alert): ActivityItem {
  const typeConfig: Record<string, { icon: typeof FileCheck; color: string }> = {
    expiring: { icon: AlertTriangle, color: "#f59e0b" },
    gap: { icon: ShieldOff, color: "#ef4444" },
    overlap: { icon: ShieldCheck, color: "#3b82f6" },
    low_confidence: { icon: MessageSquare, color: "#8b5cf6" },
    exclusion: { icon: FileText, color: "#06b6d4" },
  };
  const config = typeConfig[alert.type] || { icon: FileCheck, color: "#94a3b8" };
  return {
    icon: config.icon,
    text: alert.title,
    time: alert.description.length > 60 ? alert.description.slice(0, 57) + "..." : alert.description,
    color: config.color,
  };
}

/* ------------------------------------------------------------------ */
/*  SVG DONUT CHART (pure SVG, no libraries)                           */
/* ------------------------------------------------------------------ */

function DonutChart({
  segments,
  totalPolicies,
}: {
  segments: DonutSegment[];
  totalPolicies: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const radius = 80;
  const stroke = 28;
  const circumference = 2 * Math.PI * radius;
  const gap = 4;
  const totalGap = gap * segments.length;
  const availableDeg = 360 - totalGap;

  let cumulativeOffset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative flex-shrink-0">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {segments.map((seg, i) => {
            const segDeg = (seg.pct / 100) * availableDeg;
            const segLen = (segDeg / 360) * circumference;
            const offset = (cumulativeOffset / 360) * circumference;
            cumulativeOffset += segDeg + gap;

            return (
              <circle
                key={i}
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${mounted ? segLen : 0} ${circumference}`}
                strokeDashoffset={-offset}
                className="transition-all duration-1000 ease-out"
                style={{
                  transformOrigin: "100px 100px",
                  transform: "rotate(-90deg)",
                  filter: `drop-shadow(0 0 4px ${seg.color}40)`,
                }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-[#e2e8f0]">{totalPolicies}</span>
          <span className="text-xs text-[#64748b] font-medium">Polizas</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="h-3 w-3 rounded-full flex-shrink-0"
              style={{
                backgroundColor: seg.color,
                boxShadow: `0 0 6px ${seg.color}50`,
              }}
            />
            <span className="text-sm text-[#94a3b8] w-16">{seg.label}</span>
            <span className="text-sm font-semibold text-[#e2e8f0]">
              {seg.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  RING PROGRESS                                                      */
/* ------------------------------------------------------------------ */

function RingProgress({
  pct,
  color,
  size = 56,
}: {
  pct: number;
  color: string;
  size?: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(t);
  }, []);

  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashLen = mounted ? (pct / 100) * circumference : 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dashLen} ${circumference}`}
          className="transition-all duration-1000 ease-out"
          style={{
            transformOrigin: `${size / 2}px ${size / 2}px`,
            transform: "rotate(-90deg)",
            filter: `drop-shadow(0 0 3px ${color}50)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-xs font-bold"
          style={{ color: pct > 0 ? color : "#475569" }}
        >
          {pct}%
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ANIMATED PROGRESS BAR                                              */
/* ------------------------------------------------------------------ */

function AnimatedBar({
  pct,
  color,
  gradEnd,
  label,
  delay = 0,
}: {
  pct: number;
  color: string;
  gradEnd: string;
  label: string;
  delay?: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 300 + delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#94a3b8]">{label}</span>
        <span className="text-sm font-semibold text-[#e2e8f0]">{pct}%</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: mounted ? `${pct}%` : "0%",
            background: `linear-gradient(90deg, ${color}, ${gradEnd})`,
            boxShadow: `0 0 10px ${color}40`,
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MINI PROGRESS BAR (for sub-coverages in expanded detail)           */
/* ------------------------------------------------------------------ */

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${pct}%`,
          backgroundColor: color,
          boxShadow: `0 0 6px ${color}40`,
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TRAFFIC LIGHT HELPER                                               */
/* ------------------------------------------------------------------ */

function getTrafficLight(pct: number) {
  if (pct > 70) return { label: "Buena", color: "#10b981" };
  if (pct >= 40) return { label: "Media", color: "#f59e0b" };
  return { label: "Baja", color: "#ef4444" };
}

/* ------------------------------------------------------------------ */
/*  SKELETON COMPONENTS                                                */
/* ------------------------------------------------------------------ */

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[#2d3548] bg-[#1c2333] p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className="h-3 w-24 rounded bg-[#2d3548]" />
          <div className="h-8 w-16 rounded bg-[#2d3548]" />
          <div className="h-3 w-20 rounded bg-[#2d3548]" />
        </div>
        <div className="h-11 w-11 rounded-xl bg-[#2d3548]" />
      </div>
    </div>
  );
}

function SkeletonProtectionMap() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center gap-2 rounded-xl border border-[#2d3548] bg-[#0f1117]/60 p-4 animate-pulse"
        >
          <div className="h-[52px] w-[52px] rounded-full bg-[#2d3548]" />
          <div className="h-4 w-4 rounded bg-[#2d3548]" />
          <div className="h-3 w-12 rounded bg-[#2d3548]" />
          <div className="h-2.5 w-10 rounded bg-[#2d3548]" />
        </div>
      ))}
    </div>
  );
}

function SkeletonActivity() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-2 animate-pulse">
          <div className="h-8 w-8 rounded-lg bg-[#2d3548] flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-full rounded bg-[#2d3548]" />
            <div className="h-2.5 w-16 rounded bg-[#2d3548]" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CATEGORY DETAIL PANEL (modal overlay)                              */
/* ------------------------------------------------------------------ */

function CategoryDetailPanel({
  category,
  onClose,
}: {
  category: ProtectionCategory;
  onClose: () => void;
}) {
  const Icon = category.icon;
  const traffic = getTrafficLight(category.pct);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto rounded-2xl border border-[#2d3548] bg-[#1c2333] p-6 shadow-2xl shadow-black/50">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] hover:bg-[#0f1117] hover:text-[#e2e8f0] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${category.color}20` }}
          >
            <Icon className="h-7 w-7" style={{ color: category.color }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#e2e8f0]">{category.name}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span
                className="text-sm font-medium"
                style={{ color: traffic.color }}
              >
                Cobertura: {category.pct}% - {traffic.label}
              </span>
              <span className="text-xs text-[#64748b]">
                {category.policies} {category.policies === 1 ? "poliza" : "polizas"}
              </span>
            </div>
          </div>
        </div>

        {/* Coverage ring */}
        <div className="flex justify-center mb-6">
          <RingProgress pct={category.pct} color={traffic.color} size={80} />
        </div>

        {/* Detailed content */}
        {category.detail ? (
          <div className="space-y-5">
            {/* Policy info */}
            <div className="rounded-xl border border-[#2d3548] bg-[#0f1117]/60 p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-[#e2e8f0]">
                  {category.detail.policyName} - {category.detail.company}
                </h3>
                <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                  {category.detail.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-[#94a3b8] mt-2">
                <span>Cobertura: {category.detail.coverageAmount}</span>
                <span>Confianza: {category.detail.confidence}%</span>
              </div>
            </div>

            {/* Sub-coverages */}
            <div>
              <h4 className="text-sm font-semibold text-[#e2e8f0] mb-3 uppercase tracking-wider">
                Sub-coberturas
              </h4>
              <div className="space-y-4">
                {category.detail.subCoverages.map((sub, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-[#e2e8f0]">{sub.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#94a3b8]">{sub.amount}</span>
                        <span
                          className="text-xs font-bold"
                          style={{ color: sub.color }}
                        >
                          {sub.pct}%
                        </span>
                      </div>
                    </div>
                    <MiniBar pct={sub.pct} color={sub.color} />
                  </div>
                ))}
              </div>
            </div>

            {/* Note */}
            {category.detail.note && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                <p className="text-sm text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {category.detail.note}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-[#2d3548] bg-[#0f1117]/60 p-6 text-center">
            <p className="text-sm text-[#94a3b8]">
              {category.simpleMessage || "Sin informacion detallada disponible"}
            </p>
          </div>
        )}

        {/* Close action */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-[#2d3548] bg-[#0f1117] px-4 py-3 text-sm font-medium text-[#94a3b8] transition-all hover:border-[#3d4a63] hover:text-[#e2e8f0]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ERROR STATE                                                        */
/* ------------------------------------------------------------------ */

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center">
      <AlertTriangle className="h-10 w-10 mx-auto text-red-400 mb-3" />
      <h3 className="text-lg font-semibold text-[#e2e8f0] mb-2">
        Error al cargar datos
      </h3>
      <p className="text-sm text-[#94a3b8] mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-xl border border-[#2d3548] bg-[#1c2333] px-4 py-2.5 text-sm font-medium text-[#e2e8f0] transition-all hover:border-[#3d4a63]"
      >
        <RefreshCw className="h-4 w-4" />
        Reintentar
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN DASHBOARD PAGE                                                */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Raw API data
  const [scores, setScores] = useState<ProtectionScore[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [totalPolicies, setTotalPolicies] = useState(0);
  const [activePoliciesCount, setActivePoliciesCount] = useState(0);

  /* ----- Fetch data ----- */
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [scoresRes, alertsRes, policiesRes] = await Promise.all([
        fetch("/api/dashboard/protection-score"),
        fetch("/api/dashboard/alerts"),
        fetch("/api/policies?pageSize=100"),
      ]);

      const scoresJson: ApiResponse<ProtectionScore[]> = await scoresRes.json();
      const alertsJson: ApiResponse<Alert[]> = await alertsRes.json();
      const policiesJson: ApiResponse<PaginatedResponse<unknown>> = await policiesRes.json();

      if (!scoresRes.ok || !scoresJson.success) {
        throw new Error(scoresJson.error || "Error al cargar scores de proteccion");
      }
      if (!alertsRes.ok || !alertsJson.success) {
        throw new Error(alertsJson.error || "Error al cargar alertas");
      }
      if (!policiesRes.ok || !policiesJson.success) {
        throw new Error(policiesJson.error || "Error al cargar polizas");
      }

      const fetchedScores = scoresJson.data ?? [];
      const fetchedAlerts = alertsJson.data ?? [];
      const policiesData = policiesJson.data;

      setScores(fetchedScores);
      setAlerts(fetchedAlerts);
      setTotalPolicies(policiesData?.total ?? 0);

      // Count active policies from items
      const activeCount = (policiesData?.items as Array<{ status?: string }> | undefined)?.filter(
        (p) => p.status === "ACTIVE",
      ).length ?? 0;
      setActivePoliciesCount(activeCount);
    } catch (err) {
      console.error("[Dashboard] fetch error:", err);
      setError(err instanceof Error ? err.message : "Error desconocido al cargar el dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /* ----- Derive stat cards ----- */
  const statCards = useMemo<StatCard[]>(() => {
    const expiringCount = scores.filter((s) => s.expiringWithin30Days).length;
    const gapCount = scores.filter((s) => s.level === "RED").length;

    return [
      {
        label: "Total Polizas",
        value: String(totalPolicies),
        trend: totalPolicies > 0 ? `${totalPolicies} registradas` : "Sin polizas",
        trendUp: totalPolicies > 0,
        icon: FileText,
        color: "#3b82f6",
        bgColor: "rgba(59,130,246,0.12)",
      },
      {
        label: "Polizas Activas",
        value: String(activePoliciesCount),
        trend: totalPolicies > 0
          ? `${Math.round((activePoliciesCount / totalPolicies) * 100)}% del total`
          : "0% del total",
        trendUp: activePoliciesCount > 0,
        icon: ShieldCheck,
        color: "#10b981",
        bgColor: "rgba(16,185,129,0.12)",
      },
      {
        label: "Por Vencer (30 dias)",
        value: String(expiringCount),
        trend: expiringCount > 0 ? "Requiere atencion" : "Todo en orden",
        trendUp: expiringCount === 0,
        icon: AlertTriangle,
        color: "#f59e0b",
        bgColor: "rgba(245,158,11,0.12)",
      },
      {
        label: "Vacios de Cobertura",
        value: String(gapCount),
        trend: gapCount > 0 ? "Categorias sin cubrir" : "Cobertura completa",
        trendUp: gapCount === 0,
        icon: ShieldOff,
        color: "#ef4444",
        bgColor: "rgba(239,68,68,0.12)",
      },
    ];
  }, [scores, totalPolicies, activePoliciesCount]);

  /* ----- Derive protection categories ----- */
  const protectionCategories = useMemo<ProtectionCategory[]>(() => {
    return scores.map((score) => {
      const config = CATEGORY_CONFIG[score.category] || CATEGORY_CONFIG.OTRO;
      const pct = levelToPercent(score.level, score.confidence);

      let simpleMessage: string | undefined;
      if (score.activePolicies === 0) {
        simpleMessage = `Sin cobertura - Te recomendamos cotizar un seguro de ${config.name.toLowerCase()}`;
      } else {
        const coveredStr = score.totalCoveredAmount > 0
          ? ` - ${formatCLP(score.totalCoveredAmount)}`
          : "";
        simpleMessage = `${score.activePolicies} ${score.activePolicies === 1 ? "poliza activa" : "polizas activas"}${coveredStr}`;
      }

      return {
        name: config.name,
        pct,
        policies: score.activePolicies,
        icon: config.icon,
        color: config.color,
        simpleMessage,
      };
    });
  }, [scores]);

  /* ----- Derive donut segments ----- */
  const donutSegments = useMemo<DonutSegment[]>(() => {
    const withPolicies = scores.filter((s) => s.activePolicies > 0);
    const totalActive = withPolicies.reduce((sum, s) => sum + s.activePolicies, 0);

    if (totalActive === 0) {
      return [{ label: "Sin datos", pct: 100, color: "#475569" }];
    }

    return withPolicies.map((score) => {
      const config = CATEGORY_CONFIG[score.category] || CATEGORY_CONFIG.OTRO;
      return {
        label: config.name,
        pct: Math.round((score.activePolicies / totalActive) * 100),
        color: config.color,
      };
    });
  }, [scores]);

  /* ----- Derive coverage bars ----- */
  const coverageBars = useMemo<CoverageBar[]>(() => {
    return scores
      .filter((s) => s.activePolicies > 0)
      .map((score) => {
        const config = CATEGORY_CONFIG[score.category] || CATEGORY_CONFIG.OTRO;
        return {
          label: config.name,
          pct: levelToPercent(score.level, score.confidence),
          color: config.color,
          gradEnd: config.gradEnd,
        };
      });
  }, [scores]);

  /* ----- Derive activity items ----- */
  const activityItems = useMemo<ActivityItem[]>(() => {
    if (alerts.length === 0) return [];
    return alerts.slice(0, 6).map(alertToActivity);
  }, [alerts]);

  /* ----- Selected category for modal ----- */
  const selectedCategory = expandedCategory
    ? protectionCategories.find((c) => c.name === expandedCategory)
    : null;

  /* ----- Error state ----- */
  if (error && !loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#e2e8f0]">Panel de Control</h1>
          <p className="mt-1 text-sm text-[#64748b]">
            Resumen completo de tu cobertura de seguros
          </p>
        </div>
        <ErrorState message={error} onRetry={fetchDashboardData} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#e2e8f0]">Panel de Control</h1>
        <p className="mt-1 text-sm text-[#64748b]">
          Resumen completo de tu cobertura de seguros
        </p>
      </div>

      {/* ============================================================ */}
      {/*  VULNERABILITY SCORE BANNER                                    */}
      {/* ============================================================ */}
      <a
        href="/vulnerability"
        className="group block rounded-xl border border-[#2d3548] bg-gradient-to-r from-[#1c2333] to-[#1a1f35] p-5 transition-all hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 shadow-lg shadow-purple-500/20">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                <path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#e2e8f0] group-hover:text-purple-300 transition-colors">
                Diagnostico de Vulnerabilidad Familiar
              </h3>
              <p className="text-sm text-[#94a3b8]">
                Descubre tus brechas de cobertura y recibe recomendaciones personalizadas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!loading && (
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-medium text-amber-400">
                  {scores.filter((s) => s.level === "RED").length} brechas detectadas
                </span>
              </div>
            )}
            <svg className="h-5 w-5 text-[#64748b] group-hover:text-purple-400 transition-colors group-hover:translate-x-1 duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </div>
      </a>

      {/* ============================================================ */}
      {/*  ROW 1: STAT CARDS                                            */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-xl border border-[#2d3548] bg-[#1c2333] p-5 transition-all duration-300 hover:border-[#3d4558] hover:bg-[#232b3d] hover:scale-[1.02]"
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at top right, ${card.bgColor}, transparent 70%)`,
                    }}
                  />
                  <div className="relative flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-[#64748b]">
                        {card.label}
                      </p>
                      <p className="text-3xl font-bold text-[#e2e8f0]">
                        {card.value}
                      </p>
                      <div className="flex items-center gap-1">
                        {card.trendUp ? (
                          <TrendingUp
                            className="h-3.5 w-3.5"
                            style={{ color: card.color }}
                          />
                        ) : (
                          <ArrowUpRight
                            className="h-3.5 w-3.5"
                            style={{ color: card.color }}
                          />
                        )}
                        <span
                          className="text-xs font-medium"
                          style={{ color: card.color }}
                        >
                          {card.trend}
                        </span>
                      </div>
                    </div>
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{ backgroundColor: card.bgColor }}
                    >
                      <Icon className="h-5 w-5" style={{ color: card.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* ============================================================ */}
      {/*  ROW 2: PROTECTION MAP + ACTIVITY                             */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Protection Map (2/3) */}
        <div className="lg:col-span-2 rounded-xl border border-[#2d3548] bg-[#1c2333] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-[#e2e8f0]">
                Mapa de Proteccion
              </h2>
              <p className="text-sm text-[#64748b] mt-0.5">
                Cobertura por categoria de seguro - haz clic para ver detalle
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#64748b]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#10b981]" /> Buena
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#f59e0b]" /> Media
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#ef4444]" /> Baja
              </span>
            </div>
          </div>

          {loading ? (
            <SkeletonProtectionMap />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {protectionCategories.map((cat, i) => {
                const Icon = cat.icon;
                const traffic = getTrafficLight(cat.pct);
                return (
                  <button
                    key={i}
                    onClick={() => setExpandedCategory(cat.name)}
                    className="group relative flex flex-col items-center gap-2 rounded-xl border border-[#2d3548] bg-[#0f1117]/60 p-4 transition-all duration-300 hover:border-[#3d4558] hover:bg-[#232b3d]/60 cursor-pointer text-center"
                  >
                    {/* Glow on hover */}
                    <div
                      className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at center, ${cat.color}10, transparent 70%)`,
                      }}
                    />
                    <RingProgress pct={cat.pct} color={traffic.color} size={52} />
                    <Icon className="h-4 w-4" style={{ color: cat.color }} />
                    <span className="text-xs font-medium text-[#e2e8f0] text-center leading-tight">
                      {cat.name}
                    </span>
                    <span className="text-[10px] text-[#64748b]">
                      {cat.policies}{" "}
                      {cat.policies === 1 ? "poliza" : "polizas"}
                    </span>
                    {/* Expand indicator */}
                    <ChevronRight
                      className="absolute top-2 right-2 h-3 w-3 text-[#64748b] opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity Panel (1/3) */}
        <div className="rounded-xl border border-[#2d3548] bg-[#1c2333] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-[#e2e8f0]">
              Actividad Reciente
            </h2>
            <button className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              Ver todo
            </button>
          </div>

          {loading ? (
            <SkeletonActivity />
          ) : activityItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-8 w-8 text-[#94a3b8]/30 mb-3" />
              <p className="text-sm text-[#94a3b8]">Sin actividad reciente</p>
              <p className="text-xs text-[#64748b] mt-1">
                Las alertas y eventos apareceran aqui
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activityItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={i}
                    className="group flex items-start gap-3 rounded-lg p-2 -mx-2 transition-colors duration-200 hover:bg-white/[0.03]"
                  >
                    <div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg mt-0.5"
                      style={{
                        backgroundColor: `${item.color}15`,
                      }}
                    >
                      <Icon
                        className="h-4 w-4"
                        style={{ color: item.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#e2e8f0] leading-snug">
                        {item.text}
                      </p>
                      <p className="text-xs text-[#475569] mt-0.5">
                        {item.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/*  ROW 3: DONUT CHART + COVERAGE BARS                          */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Donut Chart */}
        <div className="rounded-xl border border-[#2d3548] bg-[#1c2333] p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[#e2e8f0]">
              Distribucion de Coberturas
            </h2>
            <p className="text-sm text-[#64748b] mt-0.5">
              Proporcion de polizas por tipo de seguro
            </p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#94a3b8]" />
            </div>
          ) : (
            <DonutChart segments={donutSegments} totalPolicies={totalPolicies} />
          )}
        </div>

        {/* Coverage Progress Bars */}
        <div className="rounded-xl border border-[#2d3548] bg-[#1c2333] p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[#e2e8f0]">
              Cobertura por Categoria
            </h2>
            <p className="text-sm text-[#64748b] mt-0.5">
              Nivel de proteccion actual por area
            </p>
          </div>
          {loading ? (
            <div className="space-y-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2 animate-pulse">
                  <div className="flex justify-between">
                    <div className="h-3 w-20 rounded bg-[#2d3548]" />
                    <div className="h-3 w-8 rounded bg-[#2d3548]" />
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#2d3548]" />
                </div>
              ))}
            </div>
          ) : coverageBars.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShieldOff className="h-8 w-8 text-[#94a3b8]/30 mb-3" />
              <p className="text-sm text-[#94a3b8]">Sin datos de cobertura</p>
              <p className="text-xs text-[#64748b] mt-1">
                Agrega polizas para ver tu nivel de proteccion
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {coverageBars.map((bar, i) => (
                <AnimatedBar
                  key={i}
                  pct={bar.pct}
                  color={bar.color}
                  gradEnd={bar.gradEnd}
                  label={bar.label}
                  delay={i * 100}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/*  EXPANDED CATEGORY DETAIL OVERLAY                             */}
      {/* ============================================================ */}
      {selectedCategory && (
        <CategoryDetailPanel
          category={selectedCategory}
          onClose={() => setExpandedCategory(null)}
        />
      )}
    </div>
  );
}
