"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Briefcase,
  Users,
  TrendingUp,
  AlertTriangle,
  Shield,
  Clock,
  ChevronRight,
  AlertCircle,
  Loader2,
  FolderOpen,
} from "lucide-react";

interface PortfolioSummary {
  totalClients: number;
  totalPolicies: number;
  activePolicies: number;
  expiringThisMonth: number;
  categorySummary: { category: string; count: number }[];
}

interface PortfolioResponse {
  success: boolean;
  data: PortfolioSummary;
  error?: string;
}

const categoryColors: string[] = [
  "from-cyan-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-purple-500 to-indigo-600",
  "from-rose-500 to-pink-600",
  "from-lime-500 to-green-600",
];

const categoryBarColors: string[] = [
  "bg-cyan-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-rose-500",
  "bg-lime-500",
];

export default function AgentPanelPage() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agent/portfolio");
      const json: PortfolioResponse = await res.json();

      if (!json.success) {
        setError(json.error ?? "Error al obtener resumen del portafolio");
        return;
      }

      setPortfolio(json.data);
    } catch {
      setError("Error de conexion al cargar el portafolio");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const stats = portfolio
    ? [
        {
          label: "Clientes activos",
          value: String(portfolio.totalClients),
          subtitle: "Total de clientes asignados",
          icon: Users,
          color: "from-cyan-500 to-blue-600",
        },
        {
          label: "Polizas gestionadas",
          value: String(portfolio.totalPolicies),
          subtitle: `${portfolio.activePolicies} activas`,
          icon: Shield,
          color: "from-emerald-500 to-teal-600",
        },
        {
          label: "Polizas activas",
          value: String(portfolio.activePolicies),
          subtitle: "Vigentes actualmente",
          icon: TrendingUp,
          color: "from-amber-500 to-orange-600",
        },
        {
          label: "Renovaciones proximas",
          value: String(portfolio.expiringThisMonth),
          subtitle: "Vencen este mes",
          icon: Clock,
          color: "from-purple-500 to-indigo-600",
        },
      ]
    : [];

  const maxCategoryCount =
    portfolio?.categorySummary?.length
      ? Math.max(...portfolio.categorySummary.map((c) => c.count))
      : 1;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
          <Briefcase className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#e2e8f0]">Panel de Agente</h1>
          <p className="text-sm text-[#94a3b8]">
            Resumen de tu cartera de clientes y actividad reciente
          </p>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
          <button
            onClick={fetchPortfolio}
            className="ml-auto rounded-lg border border-red-500/30 px-3 py-1.5 text-xs hover:bg-red-500/20 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-[#2d3548] animate-pulse" />
                  <div className="h-4 w-4 rounded bg-[#2d3548] animate-pulse" />
                </div>
                <div className="mt-3 h-7 w-16 rounded bg-[#2d3548] animate-pulse" />
                <div className="mt-2 h-3 w-24 rounded bg-[#2d3548] animate-pulse" />
                <div className="mt-1 h-3 w-20 rounded bg-[#2d3548] animate-pulse" />
              </div>
            ))
          : stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-5"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color}`}
                  >
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="mt-3 text-2xl font-bold text-white">
                  {stat.value}
                </p>
                <p className="text-xs text-[#64748b] mt-1">{stat.label}</p>
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  {stat.subtitle}
                </p>
              </div>
            ))}
      </div>

      {/* Category breakdown */}
      <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d3548]">
          <h2 className="text-base font-semibold text-[#e2e8f0]">
            Polizas por categoria
          </h2>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3.5 w-28 rounded bg-[#2d3548] animate-pulse" />
                    <div className="h-3.5 w-8 rounded bg-[#2d3548] animate-pulse" />
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#2d3548] animate-pulse" />
                </div>
              ))}
            </div>
          ) : portfolio?.categorySummary && portfolio.categorySummary.length > 0 ? (
            <div className="space-y-4">
              {portfolio.categorySummary.map((cat, i) => (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-[#e2e8f0]">
                      {cat.category}
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {cat.count}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#0f1117]">
                    <div
                      className={`h-2 rounded-full ${categoryBarColors[i % categoryBarColors.length]} transition-all duration-500`}
                      style={{
                        width: `${(cat.count / maxCategoryCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <FolderOpen className="mx-auto h-8 w-8 text-[#475569]" />
              <p className="mt-2 text-sm text-[#64748b]">
                Sin polizas activas en el portafolio
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent activity placeholder */}
      <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d3548]">
          <h2 className="text-base font-semibold text-[#e2e8f0]">
            Actividad reciente
          </h2>
        </div>
        <div className="divide-y divide-[#2d3548]">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-5 py-4"
              >
                <div className="h-9 w-9 rounded-full bg-[#2d3548] animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-32 rounded bg-[#2d3548] animate-pulse" />
                  <div className="h-3 w-48 rounded bg-[#2d3548] animate-pulse" />
                </div>
                <div className="h-3 w-20 rounded bg-[#2d3548] animate-pulse" />
              </div>
            ))
          ) : portfolio && portfolio.totalClients > 0 ? (
            <RecentActivitySection />
          ) : (
            <div className="py-8 text-center text-sm text-[#64748b]">
              No hay actividad reciente
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Fetches recent audit activity for the agent context. */
function RecentActivitySection() {
  interface AuditEntry {
    id: string;
    action: string;
    resource: string;
    createdAt: string;
    user: { name: string | null; email: string };
  }

  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/audit?pageSize=5");
        const json = await res.json();
        if (json.success) {
          setEntries(json.data.items);
        }
      } catch {
        // Silently fail -- this is a supplementary section
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const typeColors: Record<string, string> = {
    LOGIN: "bg-blue-500/20 text-blue-400",
    REGISTER: "bg-cyan-500/20 text-cyan-400",
    CREATE_POLICY: "bg-emerald-500/20 text-emerald-400",
    UPDATE_USER: "bg-amber-500/20 text-amber-400",
    VIEW_POLICY: "bg-purple-500/20 text-purple-400",
    DELETE_DOCUMENT: "bg-red-500/20 text-red-400",
  };

  const actionLabels: Record<string, string> = {
    LOGIN: "Inicio de sesion",
    REGISTER: "Registro de usuario",
    CREATE_POLICY: "Poliza creada",
    UPDATE_USER: "Usuario editado",
    VIEW_POLICY: "Poliza consultada",
    DELETE_DOCUMENT: "Documento eliminado",
  };

  function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days}d`;
  }

  if (loading) {
    return (
      <>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="h-9 w-9 rounded-full bg-[#2d3548] animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-32 rounded bg-[#2d3548] animate-pulse" />
              <div className="h-3 w-48 rounded bg-[#2d3548] animate-pulse" />
            </div>
            <div className="h-3 w-20 rounded bg-[#2d3548] animate-pulse" />
          </div>
        ))}
      </>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-[#64748b]">
        No hay actividad reciente
      </div>
    );
  }

  return (
    <>
      {entries.map((entry) => {
        const color =
          typeColors[entry.action] ?? "bg-[#2d3548] text-[#94a3b8]";
        const userName = entry.user.name ?? entry.user.email;

        return (
          <div
            key={entry.id}
            className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer group"
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${color}`}
            >
              {userName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#e2e8f0]">
                {userName}
              </p>
              <p className="text-xs text-[#64748b] mt-0.5">
                {actionLabels[entry.action] ?? entry.action}
              </p>
            </div>
            <span className="text-xs text-[#475569]">
              {timeAgo(entry.createdAt)}
            </span>
            <ChevronRight className="h-4 w-4 text-[#475569] group-hover:text-[#94a3b8] transition-colors" />
          </div>
        );
      })}
    </>
  );
}
