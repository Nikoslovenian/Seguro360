"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserCog,
  Search,
  Shield,
  Mail,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  role: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  onboardingComplete: boolean;
  organizationId: string | null;
}

interface UsersResponse {
  success: boolean;
  data: {
    items: UserRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    metadata: {
      countByRole: Record<string, number>;
    };
  };
  error?: string;
}

const roleLabels: Record<string, string> = {
  USER: "Usuario",
  AGENT: "Agente",
  ADMIN: "Admin",
  REVIEWER: "Revisor",
};

const roleColors: Record<string, string> = {
  USER: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  AGENT: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  ADMIN: "bg-red-500/10 text-red-400 border-red-500/30",
  REVIEWER: "bg-purple-500/10 text-purple-400 border-purple-500/30",
};

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [countByRole, setCountByRole] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      if (roleFilter) params.set("role", roleFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const json: UsersResponse = await res.json();

      if (!json.success) {
        setError(json.error ?? "Error al obtener usuarios");
        return;
      }

      setUsers(json.data.items);
      setTotal(json.data.total);
      setTotalPages(json.data.totalPages);
      setCountByRole(json.data.metadata.countByRole);
    } catch {
      setError("Error de conexion al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timeout);
  }, [fetchUsers]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  const totalAll = Object.values(countByRole).reduce((s, n) => s + n, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600">
          <UserCog className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#e2e8f0]">
            Gestion de Usuarios
          </h1>
          <p className="text-sm text-[#94a3b8]">
            Administra roles y permisos de los usuarios de la plataforma
          </p>
        </div>
      </div>

      {/* Search + role filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar usuario..."
            className="w-full rounded-xl border border-[#2d3548] bg-[#1c2333] py-3 pl-10 pr-4 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: null, label: "Todos" },
            { key: "USER", label: "Usuario" },
            { key: "AGENT", label: "Agente" },
            { key: "ADMIN", label: "Admin" },
            { key: "REVIEWER", label: "Revisor" },
          ].map((item) => {
            const isActive = roleFilter === item.key;
            const count =
              item.key === null ? totalAll : (countByRole[item.key] ?? 0);
            return (
              <button
                key={item.label}
                onClick={() => setRoleFilter(item.key)}
                className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                  isActive
                    ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                    : "border-[#2d3548] bg-[#1c2333] text-[#94a3b8] hover:border-cyan-500/30 hover:text-cyan-400"
                }`}
              >
                {item.label}
                {!loading && (
                  <span className="ml-1.5 text-[10px] opacity-60">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
          <button
            onClick={fetchUsers}
            className="ml-auto rounded-lg border border-red-500/30 px-3 py-1.5 text-xs hover:bg-red-500/20 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2d3548] text-left text-xs text-[#64748b]">
                <th className="px-5 py-3 font-medium">Usuario</th>
                <th className="px-5 py-3 font-medium">Rol</th>
                <th className="px-5 py-3 font-medium hidden sm:table-cell">
                  Estado
                </th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">
                  Registro
                </th>
                <th className="px-5 py-3 font-medium hidden lg:table-cell">
                  Telefono
                </th>
                <th className="px-5 py-3 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d3548]">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-[#2d3548] animate-pulse" />
                          <div className="space-y-1.5">
                            <div className="h-3.5 w-28 rounded bg-[#2d3548] animate-pulse" />
                            <div className="h-3 w-36 rounded bg-[#2d3548] animate-pulse" />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="h-5 w-16 rounded-full bg-[#2d3548] animate-pulse" />
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <div className="h-3.5 w-12 rounded bg-[#2d3548] animate-pulse" />
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="h-3.5 w-20 rounded bg-[#2d3548] animate-pulse" />
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <div className="h-3.5 w-24 rounded bg-[#2d3548] animate-pulse" />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="h-4 w-4 rounded bg-[#2d3548] animate-pulse" />
                      </td>
                    </tr>
                  ))
                : users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400 text-xs font-semibold">
                            {(user.name ?? user.email)
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#e2e8f0]">
                              {user.name ?? "Sin nombre"}
                            </p>
                            <p className="flex items-center gap-1 text-xs text-[#64748b]">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${roleColors[user.role] ?? "bg-gray-500/10 text-gray-400 border-gray-500/30"}`}
                        >
                          <Shield className="h-3 w-3" />
                          {roleLabels[user.role] ?? user.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs ${user.onboardingComplete ? "text-emerald-400" : "text-[#64748b]"}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${user.onboardingComplete ? "bg-emerald-400" : "bg-[#475569]"}`}
                          />
                          {user.onboardingComplete ? "Activo" : "Pendiente"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#64748b] hidden md:table-cell">
                        {new Date(user.createdAt).toLocaleDateString("es-CL")}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[#94a3b8] hidden lg:table-cell">
                        {user.phone ?? "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <button className="p-1 rounded text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {!loading && !error && users.length === 0 && (
          <div className="py-12 text-center text-sm text-[#64748b]">
            No se encontraron usuarios
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-[#2d3548] px-5 py-3">
          <p className="text-xs text-[#64748b]">
            {loading ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Cargando...
              </span>
            ) : (
              `${users.length} de ${total} usuarios`
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
