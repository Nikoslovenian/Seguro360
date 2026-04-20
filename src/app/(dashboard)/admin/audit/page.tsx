"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  LogIn,
  UserPlus,
  FileText,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Activity,
} from "lucide-react";

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface AuditResponse {
  success: boolean;
  data: {
    items: AuditLog[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  error?: string;
}

const actionConfig: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }
> = {
  LOGIN: {
    label: "Inicio de sesion",
    icon: LogIn,
    color: "text-blue-400 bg-blue-500/10",
  },
  REGISTER: {
    label: "Registro de usuario",
    icon: UserPlus,
    color: "text-cyan-400 bg-cyan-500/10",
  },
  CREATE_POLICY: {
    label: "Poliza creada",
    icon: FileText,
    color: "text-emerald-400 bg-emerald-500/10",
  },
  UPDATE_USER: {
    label: "Usuario editado",
    icon: Edit3,
    color: "text-amber-400 bg-amber-500/10",
  },
  VIEW_POLICY: {
    label: "Poliza consultada",
    icon: Eye,
    color: "text-purple-400 bg-purple-500/10",
  },
  DELETE_DOCUMENT: {
    label: "Documento eliminado",
    icon: Trash2,
    color: "text-red-400 bg-red-500/10",
  },
};

const defaultActionConfig = {
  icon: Activity,
  color: "text-[#94a3b8] bg-[#2d3548]",
};

const PAGE_SIZE = 20;

export default function AdminAuditPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      if (actionFilter) params.set("action", actionFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      const json: AuditResponse = await res.json();

      if (!json.success) {
        setError(json.error ?? "Error al obtener registros de auditoria");
        return;
      }

      setItems(json.data.items);
      setTotal(json.data.total);
      setTotalPages(json.data.totalPages);
    } catch {
      setError("Error de conexion al cargar registros");
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, dateFrom, dateTo]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchAudit();
    }, 300);
    return () => clearTimeout(timeout);
  }, [fetchAudit]);

  useEffect(() => {
    setPage(1);
  }, [actionFilter, dateFrom, dateTo]);

  // Client-side search (the API filters by action, but we also filter display by user/email text)
  const filtered = search.trim()
    ? items.filter(
        (e) =>
          (e.action.toLowerCase().includes(search.toLowerCase()) ||
           (actionConfig[e.action]?.label ?? e.action).toLowerCase().includes(search.toLowerCase()) ||
           (e.user.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
           e.user.email.toLowerCase().includes(search.toLowerCase())),
      )
    : items;

  function parseDetails(details: string | null): Record<string, unknown> | null {
    if (!details) return null;
    try {
      return JSON.parse(details);
    } catch {
      return null;
    }
  }

  function formatTimestamp(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("es-CL") + " " + d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#e2e8f0]">
            Registro de Auditoria
          </h1>
          <p className="text-sm text-[#94a3b8]">
            Historial completo de acciones en la plataforma
          </p>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por accion, usuario o email..."
            className="w-full rounded-xl border border-[#2d3548] bg-[#1c2333] py-3 pl-10 pr-4 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 rounded-xl border px-4 text-sm transition-colors ${
            showFilters
              ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
              : "border-[#2d3548] bg-[#1c2333] text-[#94a3b8] hover:border-cyan-500/30 hover:text-cyan-400"
          }`}
        >
          <Filter className="h-4 w-4" />
          Filtros
        </button>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-[#2d3548] bg-[#1c2333] p-4">
          <div>
            <label className="block text-xs text-[#64748b] mb-1.5">Accion</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full rounded-lg border border-[#2d3548] bg-[#0f1117] px-3 py-2 text-sm text-[#e2e8f0] focus:border-cyan-500/50 focus:outline-none"
            >
              <option value="">Todas</option>
              <option value="LOGIN">Inicio de sesion</option>
              <option value="REGISTER">Registro</option>
              <option value="CREATE_POLICY">Poliza creada</option>
              <option value="UPDATE_USER">Usuario editado</option>
              <option value="VIEW_POLICY">Poliza consultada</option>
              <option value="DELETE_DOCUMENT">Documento eliminado</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#64748b] mb-1.5">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-[#2d3548] bg-[#0f1117] px-3 py-2 text-sm text-[#e2e8f0] focus:border-cyan-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-[#64748b] mb-1.5">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-[#2d3548] bg-[#0f1117] px-3 py-2 text-sm text-[#e2e8f0] focus:border-cyan-500/50 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
          <button
            onClick={fetchAudit}
            className="ml-auto rounded-lg border border-red-500/30 px-3 py-1.5 text-xs hover:bg-red-500/20 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Audit log */}
      <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] overflow-hidden">
        <div className="divide-y divide-[#2d3548]">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <div className="h-9 w-9 rounded-full bg-[#2d3548] animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-40 rounded bg-[#2d3548] animate-pulse" />
                    <div className="h-3 w-56 rounded bg-[#2d3548] animate-pulse" />
                  </div>
                  <div className="hidden sm:block space-y-1.5">
                    <div className="h-3 w-28 rounded bg-[#2d3548] animate-pulse ml-auto" />
                    <div className="h-3 w-20 rounded bg-[#2d3548] animate-pulse ml-auto" />
                  </div>
                </div>
              ))
            : filtered.map((entry) => {
                const config = actionConfig[entry.action] ?? {
                  label: entry.action,
                  ...defaultActionConfig,
                };
                const Icon = config.icon;
                const details = parseDetails(entry.details);
                const isExpanded = expandedId === entry.id;

                return (
                  <div key={entry.id}>
                    <div
                      className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : entry.id)
                      }
                    >
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full ${config.color}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#e2e8f0]">
                          {config.label}
                        </p>
                        <p className="text-xs text-[#64748b] mt-0.5">
                          {entry.user.name ?? "Sin nombre"} ({entry.user.email})
                        </p>
                      </div>
                      <div className="hidden sm:block text-right">
                        <p className="text-xs text-[#94a3b8]">
                          {formatTimestamp(entry.createdAt)}
                        </p>
                        {entry.ipAddress && (
                          <p className="text-xs text-[#475569] mt-0.5">
                            IP: {entry.ipAddress}
                          </p>
                        )}
                      </div>
                      <span className="rounded-md bg-[#0f1117] border border-[#2d3548] px-2 py-1 text-[10px] text-[#64748b] font-mono hidden md:inline">
                        {entry.resource}
                      </span>
                      {details && (
                        isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-[#475569]" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-[#475569]" />
                        )
                      )}
                    </div>
                    {/* Expanded details */}
                    {isExpanded && details && (
                      <div className="px-5 pb-4 pl-[4.25rem]">
                        <pre className="rounded-lg border border-[#2d3548] bg-[#0f1117] p-3 text-xs text-[#94a3b8] font-mono overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}

          {!loading && filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-[#64748b]">
              No se encontraron registros
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-[#2d3548] px-5 py-3">
          <p className="text-xs text-[#64748b]">
            {loading ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Cargando...
              </span>
            ) : (
              `${total} registros`
            )}
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded text-[#64748b] hover:text-[#e2e8f0] disabled:opacity-30 disabled:hover:text-[#64748b] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs text-[#94a3b8]">
              {page} / {totalPages || 1}
            </span>
            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded text-[#64748b] hover:text-[#e2e8f0] disabled:opacity-30 disabled:hover:text-[#64748b] transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
