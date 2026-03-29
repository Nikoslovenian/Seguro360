"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Upload,
  MessageSquare,
  Calculator,
  Library,
  User,
  Users,
  Briefcase,
  UserCog,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Polizas", href: "/policies", icon: FileText },
  { label: "Documentos", href: "/documents", icon: Upload },
  { label: "Chat IA", href: "/chat", icon: MessageSquare },
  { label: "Simulador", href: "/simulate", icon: Calculator },
  { label: "Biblioteca", href: "/library", icon: Library },
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
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
          CS
        </div>
        <span className="text-lg font-bold text-gray-900">CoverSight</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    isActive ? "text-blue-700" : "text-gray-400"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Agent section */}
        {showAgentSection && (
          <div className="mt-6">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
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
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        isActive ? "text-blue-700" : "text-gray-400"
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Admin section */}
        {showAdminSection && (
          <div className="mt-6">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
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
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        isActive ? "text-blue-700" : "text-gray-400"
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 px-4 py-3">
        <p className="text-xs text-gray-400 text-center">
          CoverSight v0.1.0
        </p>
      </div>
    </aside>
  );
}
