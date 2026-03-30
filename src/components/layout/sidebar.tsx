"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  ShieldCheck,
  MessageSquare,
  Calculator,
  BookOpen,
  User,
  Users,
  Briefcase,
  UserCog,
  Shield,
  HeartPulse,
  Bell,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Diagnostico", href: "/vulnerability", icon: HeartPulse },
  { label: "Alertas", href: "/alerts", icon: Bell },
  { label: "Letra Chica", href: "/fine-print", icon: Eye },
  { label: "Mis Seguros", href: "/documents", icon: ShieldCheck },
  { label: "Chat IA", href: "/chat", icon: MessageSquare },
  { label: "Simulador", href: "/simulate", icon: Calculator },
  { label: "Biblioteca", href: "/library", icon: BookOpen },
  { label: "Perfil", href: "/profile", icon: User },
];

const agentNavItems: NavItem[] = [
  { label: "Mis Clientes", href: "/agent/clients", icon: Users },
  { label: "Panel Agente", href: "/agent/panel", icon: Briefcase },
];

const adminNavItems: NavItem[] = [
  { label: "Usuarios", href: "/admin/users", icon: UserCog },
  { label: "Auditoria", href: "/admin/audit", icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;

  const showAgentSection = role === "AGENT" || role === "ADMIN";
  const showAdminSection = role === "ADMIN";

  return (
    <aside className="flex h-full w-64 flex-col bg-[#161b22] border-r border-[#2d3548]">
      {/* Logo area with gradient glow */}
      <div className="relative flex h-16 items-center gap-3 border-b border-[#2d3548] px-6">
        {/* Glow behind logo */}
        <div className="absolute left-5 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 blur-lg" />
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold text-[10px] shadow-lg shadow-cyan-500/20">
          360
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Seguro 360
          </span>
          <span className="text-[10px] text-[#94a3b8] -mt-0.5 tracking-wider uppercase">
            Seguros Inteligentes
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "text-white bg-white/[0.06]"
                    : "text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.04]"
                )}
              >
                {/* Active indicator - left border accent */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-gradient-to-b from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                )}
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
                    isActive
                      ? "text-cyan-400"
                      : "text-[#64748b] group-hover:text-[#94a3b8]"
                  )}
                />
                <span>{item.label}</span>
                {/* Subtle glow on active */}
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/[0.05] to-blue-500/[0.05] pointer-events-none" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Agent section */}
        {showAgentSection && (
          <div className="mt-8">
            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#475569]">
              Agente
            </p>
            <div className="space-y-1">
              {agentNavItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "text-white bg-white/[0.06]"
                        : "text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.04]"
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-gradient-to-b from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                    )}
                    <item.icon
                      className={cn(
                        "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
                        isActive
                          ? "text-cyan-400"
                          : "text-[#64748b] group-hover:text-[#94a3b8]"
                      )}
                    />
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/[0.05] to-blue-500/[0.05] pointer-events-none" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Admin section */}
        {showAdminSection && (
          <div className="mt-8">
            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#475569]">
              Administracion
            </p>
            <div className="space-y-1">
              {adminNavItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "text-white bg-white/[0.06]"
                        : "text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.04]"
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-gradient-to-b from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                    )}
                    <item.icon
                      className={cn(
                        "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
                        isActive
                          ? "text-cyan-400"
                          : "text-[#64748b] group-hover:text-[#94a3b8]"
                      )}
                    />
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/[0.05] to-blue-500/[0.05] pointer-events-none" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Footer with version badge */}
      <div className="border-t border-[#2d3548] px-4 py-3">
        <div className="flex items-center justify-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
          <p className="text-[11px] text-[#475569] font-medium">
            Seguro 360 v0.1.0
          </p>
        </div>
      </div>
    </aside>
  );
}
