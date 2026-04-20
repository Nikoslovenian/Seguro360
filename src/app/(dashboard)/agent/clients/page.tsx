"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  Search,
  Mail,
  Phone,
  ChevronRight,
  UserPlus,
  AlertCircle,
  Loader2,
  ChevronLeft,
  UserX,
} from "lucide-react";

interface Client {
  id: string;
  name: string | null;
  email: string;
  role: string;
  rut: string | null;
  phone: string | null;
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ClientsResponse {
  success: boolean;
  data: {
    items: Client[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  error?: string;
}

const PAGE_SIZE = 20;

export default function AgentClientsPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/agent/clients?${params.toString()}`);
      const json: ClientsResponse = await res.json();

      if (!json.success) {
        setError(json.error ?? "Error al obtener clientes");
        return;
      }

      setClients(json.data.items);
      setTotal(json.data.total);
      setTotalPages(json.data.totalPages);
    } catch {
      setError("Error de conexion al cargar clientes");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchClients();
    }, 300);
    return () => clearTimeout(timeout);
  }, [fetchClients]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#e2e8f0]">Mis Clientes</h1>
            <p className="text-sm text-[#94a3b8]">
              Gestiona y monitorea la proteccion de tus clientes
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all">
          <UserPlus className="h-4 w-4" />
          Invitar cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="w-full rounded-xl border border-[#2d3548] bg-[#1c2333] py-3 pl-10 pr-4 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#2d3548] bg-[#1c2333] p-4"
            >
              <div className="h-3 w-20 rounded bg-[#2d3548] animate-pulse" />
              <div className="mt-2 h-7 w-12 rounded bg-[#2d3548] animate-pulse" />
            </div>
          ))
        ) : (
          <>
            <div className="rounded-xl border border-[#2d3548] bg-[#1c2333] p-4">
              <p className="text-xs text-[#64748b]">Total clientes</p>
              <p className="mt-1 text-2xl font-bold text-white">{total}</p>
            </div>
            <div className="rounded-xl border border-[#2d3548] bg-[#1c2333] p-4">
              <p className="text-xs text-[#64748b]">Onboarding completo</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {clients.filter((c) => c.onboardingComplete).length}
              </p>
            </div>
            <div className="rounded-xl border border-[#2d3548] bg-[#1c2333] p-4">
              <p className="text-xs text-[#64748b]">Onboarding pendiente</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {clients.filter((c) => !c.onboardingComplete).length}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
          <button
            onClick={fetchClients}
            className="ml-auto rounded-lg border border-red-500/30 px-3 py-1.5 text-xs hover:bg-red-500/20 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Client list */}
      <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] overflow-hidden">
        <div className="divide-y divide-[#2d3548]">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <div className="h-10 w-10 rounded-full bg-[#2d3548] animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-32 rounded bg-[#2d3548] animate-pulse" />
                    <div className="h-3 w-48 rounded bg-[#2d3548] animate-pulse" />
                  </div>
                  <div className="hidden sm:flex items-center gap-4">
                    <div className="h-5 w-16 rounded bg-[#2d3548] animate-pulse" />
                    <div className="h-3 w-20 rounded bg-[#2d3548] animate-pulse" />
                  </div>
                </div>
              ))
            : clients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400 font-semibold text-sm">
                    {(client.name ?? client.email)
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#e2e8f0]">
                      {client.name ?? "Sin nombre"}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-[#64748b]">
                        <Mail className="h-3 w-3" />
                        {client.email}
                      </span>
                      {client.phone && (
                        <span className="flex items-center gap-1 text-xs text-[#64748b]">
                          <Phone className="h-3 w-3" />
                          {client.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs ${
                        client.onboardingComplete
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          client.onboardingComplete
                            ? "bg-emerald-400"
                            : "bg-amber-400"
                        }`}
                      />
                      {client.onboardingComplete ? "Activo" : "Pendiente"}
                    </span>
                    <span className="text-xs text-[#475569]">
                      {new Date(client.createdAt).toLocaleDateString("es-CL")}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#475569] group-hover:text-[#94a3b8] transition-colors" />
                </div>
              ))}

          {/* Empty state */}
          {!loading && clients.length === 0 && !error && (
            <div className="py-16 text-center">
              <UserX className="mx-auto h-10 w-10 text-[#475569]" />
              <p className="mt-3 text-sm text-[#64748b]">
                {search.trim()
                  ? "No se encontraron clientes con esa busqueda"
                  : "Aun no tienes clientes asignados"}
              </p>
              {!search.trim() && (
                <p className="mt-1 text-xs text-[#475569]">
                  Invita a un cliente para comenzar
                </p>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {(total > 0 || loading) && (
          <div className="flex items-center justify-between border-t border-[#2d3548] px-5 py-3">
            <p className="text-xs text-[#64748b]">
              {loading ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Cargando...
                </span>
              ) : (
                `${clients.length} de ${total} clientes`
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
        )}
      </div>
    </div>
  );
}
