"use client";

import { useEffect, useState, useCallback } from "react";
import type { Alert } from "@/types/insurance";
import {
  Bell,
  Clock,
  Calendar,
  HeartPulse,
  Shield,
  Home,
  Users,
  Heart,
  TrendingUp,
  Scale,
  AlertOctagon,
  ShieldAlert,
  GraduationCap,
  X,
  Filter,
  ChevronDown,
  Layers,
  Search,
} from "lucide-react";

// ─── Icon Mapping ────────────────────────────────────────────────────────────

const iconComponents: Record<string, React.ReactNode> = {
  Clock: <Clock className="w-5 h-5" />,
  Calendar: <Calendar className="w-5 h-5" />,
  HeartPulse: <HeartPulse className="w-5 h-5" />,
  Shield: <Shield className="w-5 h-5" />,
  Home: <Home className="w-5 h-5" />,
  Users: <Users className="w-5 h-5" />,
  Heart: <Heart className="w-5 h-5" />,
  TrendingUp: <TrendingUp className="w-5 h-5" />,
  Scale: <Scale className="w-5 h-5" />,
  AlertOctagon: <AlertOctagon className="w-5 h-5" />,
  ShieldAlert: <ShieldAlert className="w-5 h-5" />,
  GraduationCap: <GraduationCap className="w-5 h-5" />,
  Layers: <Layers className="w-5 h-5" />,
  Search: <Search className="w-5 h-5" />,
};

// ─── Map API alert types to display ──────────────────────────────────────────

function mapApiTypeToIcon(type: string): string {
  switch (type) {
    case "expiring":
      return "Clock";
    case "gap":
      return "ShieldAlert";
    case "overlap":
      return "Layers";
    case "low_confidence":
      return "Search";
    case "exclusion":
      return "AlertOctagon";
    default:
      return "Bell";
  }
}

function mapApiSeverity(severity: string): string {
  switch (severity) {
    case "high":
      return "critica";
    case "medium":
      return "alta";
    case "low":
      return "media";
    default:
      return "baja";
  }
}

function mapApiType(type: string): string {
  switch (type) {
    case "expiring":
      return "vencimiento";
    case "gap":
      return "brecha";
    case "overlap":
      return "cobertura";
    case "low_confidence":
      return "legal";
    case "exclusion":
      return "cobertura";
    default:
      return type;
  }
}

// Internal alert representation (superset of API Alert for UI rendering)
interface DisplayAlert {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  recommendation: string;
  category?: string;
  relatedPolicyId?: string;
  dueDate?: string;
  icon: string;
  actionLabel?: string;
  actionHref?: string;
  isNew: boolean;
  createdAt: string;
}

function mapApiAlertToDisplay(alert: Alert): DisplayAlert {
  const mappedSeverity = mapApiSeverity(alert.severity);
  const mappedType = mapApiType(alert.type);
  const icon = mapApiTypeToIcon(alert.type);

  // Generate contextual recommendation based on type
  let recommendation = "";
  switch (alert.type) {
    case "expiring":
      recommendation = "Gestiona la renovacion a la brevedad para evitar periodos sin cobertura.";
      break;
    case "gap":
      recommendation = "Evalua contratar una poliza para cubrir esta brecha de proteccion.";
      break;
    case "overlap":
      recommendation = "Revisa si existe duplicidad de cobertura y si puedes optimizar costos.";
      break;
    case "low_confidence":
      recommendation = "Revisa manualmente el documento para verificar la informacion extraida.";
      break;
    default:
      recommendation = "Revisa esta alerta y toma las medidas necesarias.";
  }

  // Determine action based on type
  let actionLabel: string | undefined;
  let actionHref: string | undefined;
  if (alert.type === "expiring") {
    actionLabel = "Ver poliza";
    actionHref = "/documents";
  } else if (alert.type === "gap") {
    actionLabel = "Ver opciones";
    actionHref = "/library";
  } else if (alert.type === "low_confidence" && alert.relatedPolicyId) {
    actionLabel = "Revisar";
    actionHref = "/documents";
  }

  return {
    id: alert.id,
    type: mappedType,
    severity: mappedSeverity,
    title: alert.title,
    description: alert.description,
    recommendation,
    category: alert.category,
    relatedPolicyId: alert.relatedPolicyId,
    icon,
    actionLabel,
    actionHref,
    isNew: alert.type === "expiring" && alert.severity === "high",
    createdAt: new Date().toISOString().split("T")[0],
  };
}

// ─── Severity Helpers ────────────────────────────────────────────────────────

function getSeverityBorder(severity: string): string {
  switch (severity) {
    case "critica":
      return "border-l-red-500";
    case "alta":
      return "border-l-orange-500";
    case "media":
      return "border-l-amber-500";
    case "baja":
      return "border-l-blue-500";
    default:
      return "border-l-slate-500";
  }
}

function getSeverityBadge(severity: string): string {
  switch (severity) {
    case "critica":
      return "bg-red-500/20 text-red-400 border border-red-500/40";
    case "alta":
      return "bg-orange-500/20 text-orange-400 border border-orange-500/40";
    case "media":
      return "bg-amber-500/20 text-amber-400 border border-amber-500/40";
    case "baja":
      return "bg-blue-500/20 text-blue-400 border border-blue-500/40";
    default:
      return "bg-slate-500/20 text-slate-400 border border-slate-500/40";
  }
}

function getSeverityLabel(severity: string): string {
  switch (severity) {
    case "critica":
      return "Critica";
    case "alta":
      return "Alta";
    case "media":
      return "Media";
    case "baja":
      return "Baja";
    default:
      return severity;
  }
}

function getTypeBadge(type: string): { label: string; className: string } {
  switch (type) {
    case "vencimiento":
      return {
        label: "Vencimiento",
        className: "bg-red-500/15 text-red-400 border border-red-500/30",
      };
    case "brecha":
      return {
        label: "Brecha",
        className: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
      };
    case "familiar":
      return {
        label: "Familiar",
        className: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30",
      };
    case "prima":
      return {
        label: "Prima",
        className: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
      };
    case "cobertura":
      return {
        label: "Cobertura",
        className: "bg-green-500/15 text-green-400 border border-green-500/30",
      };
    case "legal":
      return {
        label: "Legal",
        className: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30",
      };
    case "oportunidad":
      return {
        label: "Oportunidad",
        className: "bg-teal-500/15 text-teal-400 border border-teal-500/30",
      };
    default:
      return {
        label: type,
        className: "bg-slate-500/15 text-slate-400 border border-slate-500/30",
      };
  }
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function AlertsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/30">
          <Bell className="w-7 h-7 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Centro de Alertas</h1>
          <p className="text-sm text-slate-400">Cargando alertas...</p>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-[#1c2333] border border-[#2d3548] rounded-xl p-4 flex items-center gap-4 animate-pulse"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-700" />
            <div>
              <div className="w-8 h-6 bg-slate-700 rounded mb-1" />
              <div className="w-20 h-3 bg-slate-800 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Alert skeletons */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-[#1c2333] border border-[#2d3548] rounded-xl border-l-4 border-l-slate-600 animate-pulse"
          >
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-slate-700" />
                <div className="w-16 h-4 bg-slate-700 rounded" />
                <div className="w-12 h-4 bg-slate-700 rounded" />
              </div>
              <div className="w-3/4 h-5 bg-slate-700 rounded mb-2" />
              <div className="w-full h-4 bg-slate-800 rounded mb-1" />
              <div className="w-2/3 h-4 bg-slate-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<DisplayAlert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [dismissing, setDismissing] = useState<Set<string>>(new Set());
  const [severityFilter, setSeverityFilter] = useState<string>("todas");
  const [typeFilter, setTypeFilter] = useState<string>("todos");
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real alerts from API
  useEffect(() => {
    let cancelled = false;

    async function fetchAlerts() {
      try {
        const res = await fetch("/api/dashboard/alerts");
        if (!res.ok) throw new Error("Error al cargar alertas");
        const json = await res.json();

        if (cancelled) return;

        if (!json.success) {
          setError(json.error || "Error desconocido");
          setLoading(false);
          return;
        }

        const apiAlerts: Alert[] = json.data ?? [];
        const displayAlerts = apiAlerts.map(mapApiAlertToDisplay);
        setAlerts(displayAlerts);
        setLoading(false);
        setTimeout(() => setLoaded(true), 100);
      } catch (err) {
        console.error("Error fetching alerts:", err);
        if (!cancelled) {
          setError("No se pudieron cargar las alertas. Intenta nuevamente.");
          setLoading(false);
        }
      }
    }

    fetchAlerts();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Dismiss logic ──
  const handleDismiss = useCallback((id: string) => {
    setDismissing((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setDismissed((prev) => new Set(prev).add(id));
      setDismissing((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  }, []);

  // ── Loading state ──
  if (loading) {
    return <AlertsSkeleton />;
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/30">
            <Bell className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Centro de Alertas</h1>
            <p className="text-sm text-slate-400">
              Alertas inteligentes basadas en tu perfil y polizas
            </p>
          </div>
        </div>
        <div className="bg-[#1c2333] border border-[#2d3548] rounded-xl p-12 text-center">
          <AlertOctagon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg mb-2">Error al cargar alertas</p>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // ── Filtered alerts ──
  const visibleAlerts = alerts.filter((a) => {
    if (dismissed.has(a.id)) return false;
    if (severityFilter !== "todas" && a.severity !== severityFilter) return false;
    if (typeFilter !== "todos" && a.type !== typeFilter) return false;
    return true;
  });

  // ── Stats ──
  const activeAlerts = alerts.filter((a) => !dismissed.has(a.id));
  const totalCount = activeAlerts.length;
  const criticaCount = activeAlerts.filter((a) => a.severity === "critica").length;
  const newCount = activeAlerts.filter((a) => a.isNew).length;

  // ── Unique types for filter dropdown ──
  const uniqueTypes = Array.from(new Set(alerts.map((a) => a.type)));

  return (
    <div
      className={`space-y-6 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/30">
          <Bell className="w-7 h-7 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Centro de Alertas</h1>
          <p className="text-sm text-slate-400">
            Alertas inteligentes basadas en tu perfil familiar y polizas
          </p>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1c2333] border border-[#2d3548] rounded-xl p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-slate-500/20">
            <Bell className="w-5 h-5 text-slate-300" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{totalCount}</p>
            <p className="text-xs text-slate-400">Alertas activas</p>
          </div>
        </div>
        <div className="bg-[#1c2333] border border-[#2d3548] rounded-xl p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-red-500/20">
            <AlertOctagon className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-400">{criticaCount}</p>
            <p className="text-xs text-slate-400">Criticas</p>
          </div>
        </div>
        <div className="bg-[#1c2333] border border-[#2d3548] rounded-xl p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-emerald-500/20">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400">{newCount}</p>
            <p className="text-xs text-slate-400">Nuevas esta semana</p>
          </div>
        </div>
      </div>

      {/* ── Filter Tabs + Type Dropdown ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Severity tabs */}
        <div className="flex gap-1 bg-[#1c2333] border border-[#2d3548] rounded-xl p-1">
          {(
            [
              { key: "todas", label: "Todas" },
              { key: "critica", label: "Criticas" },
              { key: "alta", label: "Altas" },
              { key: "media", label: "Media" },
              { key: "baja", label: "Baja" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSeverityFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                severityFilter === key
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              {label}
              {key !== "todas" && (
                <span className="ml-1.5 text-xs opacity-60">
                  {activeAlerts.filter((a) => a.severity === key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Type dropdown */}
        <div className="relative">
          <button
            onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-[#1c2333] border border-[#2d3548] rounded-xl text-sm text-slate-300 hover:border-slate-500 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>
              {typeFilter === "todos"
                ? "Todos los tipos"
                : getTypeBadge(typeFilter).label}
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${typeDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>
          {typeDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 z-20 bg-[#1c2333] border border-[#2d3548] rounded-xl shadow-xl py-1 min-w-[180px]">
              <button
                onClick={() => {
                  setTypeFilter("todos");
                  setTypeDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  typeFilter === "todos"
                    ? "text-white bg-white/10"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Todos los tipos
              </button>
              {uniqueTypes.map((type) => {
                const badge = getTypeBadge(type);
                return (
                  <button
                    key={type}
                    onClick={() => {
                      setTypeFilter(type);
                      setTypeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      typeFilter === type
                        ? "text-white bg-white/10"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {badge.label}
                    <span className="ml-2 text-xs opacity-50">
                      (
                      {
                        activeAlerts.filter((a) => a.type === type).length
                      }
                      )
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Alert List ── */}
      <div className="space-y-3">
        {visibleAlerts.length === 0 && (
          <div className="bg-[#1c2333] border border-[#2d3548] rounded-xl p-12 text-center">
            {alerts.length === 0 ? (
              <>
                <Shield className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-green-400 text-lg font-semibold">Todo en orden</p>
                <p className="text-slate-400 text-sm mt-1">
                  No hay alertas activas para tus polizas. Sube mas documentos para un analisis completo.
                </p>
              </>
            ) : (
              <>
                <Bell className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No hay alertas con estos filtros</p>
                <p className="text-slate-500 text-sm mt-1">
                  Ajusta los filtros para ver mas alertas
                </p>
              </>
            )}
          </div>
        )}

        {visibleAlerts.map((alert, index) => {
          const isDismissing = dismissing.has(alert.id);
          const typeBadge = getTypeBadge(alert.type);

          return (
            <div
              key={alert.id}
              className={`bg-[#1c2333] border border-[#2d3548] rounded-xl border-l-4 ${getSeverityBorder(
                alert.severity,
              )} overflow-hidden transition-all duration-300 ${
                isDismissing
                  ? "opacity-0 translate-x-8 max-h-0 mb-0 py-0 scale-95"
                  : "opacity-100 translate-x-0 max-h-[600px]"
              }`}
              style={{
                animationDelay: `${index * 60}ms`,
                animation: loaded ? `fadeSlideIn 0.4s ease-out ${index * 60}ms both` : "none",
              }}
            >
              <div className="p-5">
                {/* Top row: badges + dismiss */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center flex-wrap gap-2">
                    {/* Type icon */}
                    <div
                      className={`p-1.5 rounded-lg ${
                        alert.severity === "critica"
                          ? "bg-red-500/20 text-red-400"
                          : alert.severity === "alta"
                            ? "bg-orange-500/20 text-orange-400"
                            : alert.severity === "media"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {iconComponents[alert.icon] || (
                        <Bell className="w-5 h-5" />
                      )}
                    </div>

                    {/* NEW badge */}
                    {alert.isNew && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                        </span>
                        Nueva
                      </span>
                    )}

                    {/* Type badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${typeBadge.className}`}
                    >
                      {typeBadge.label}
                    </span>

                    {/* Severity badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getSeverityBadge(
                        alert.severity,
                      )}`}
                    >
                      {getSeverityLabel(alert.severity)}
                    </span>

                    {/* Category badge */}
                    {alert.category && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-500/15 text-slate-400 border border-slate-500/30">
                        {alert.category}
                      </span>
                    )}
                  </div>

                  {/* Dismiss button */}
                  <button
                    onClick={() => handleDismiss(alert.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors flex-shrink-0"
                    title="Descartar alerta"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-white mb-1.5">
                  {alert.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-400 leading-relaxed mb-3">
                  {alert.description}
                </p>

                {/* Recommendation box */}
                <div className="bg-[#0f1117] border border-[#2d3548] rounded-lg p-3 mb-3">
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
                    Recomendacion
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {alert.recommendation}
                  </p>
                </div>

                {/* Bottom row: due date + action */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {alert.dueDate && (
                      <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        Vence: {alert.dueDate}
                      </span>
                    )}
                    <span className="text-xs text-slate-600">
                      {alert.createdAt}
                    </span>
                  </div>

                  {alert.actionLabel && alert.actionHref && (
                    <a
                      href={alert.actionHref}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                    >
                      {alert.actionLabel}
                      <ChevronDown className="w-3 h-3 -rotate-90" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Close dropdown on click outside */}
      {typeDropdownOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setTypeDropdownOpen(false)}
        />
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
