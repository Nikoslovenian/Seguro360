"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { LogOut, User, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const roleLabels: Record<string, string> = {
  USER: "Usuario",
  AGENT: "Agente",
  ADMIN: "Administrador",
  REVIEWER: "Revisor",
};

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-500/20 text-red-400 border-red-500/30",
  AGENT: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  USER: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  REVIEWER: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export function UserButton() {
  const { data: session } = useSession();
  const user = session?.user;

  if (!user) {
    return null;
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.charAt(0).toUpperCase() ?? "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative h-9 w-9 rounded-full hover:bg-white/[0.06] cursor-pointer outline-none">
        <Avatar className="h-9 w-9">
          <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
          <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-sm font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 bg-[#1c2333] border border-[#2d3548] shadow-xl shadow-black/40"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel className="font-normal px-3 py-3">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#e2e8f0]">
                {user.name ?? "Usuario"}
              </p>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${roleColors[user.role] ?? roleColors.USER}`}
              >
                {roleLabels[user.role] ?? user.role}
              </span>
            </div>
            <p className="text-xs text-[#64748b]">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#2d3548]" />
        <DropdownMenuItem asChild>
          <Link
            href="/profile"
            className="flex items-center cursor-pointer px-3 py-2 text-[#94a3b8] hover:text-[#e2e8f0] focus:bg-white/[0.06] focus:text-[#e2e8f0]"
          >
            <User className="mr-2 h-4 w-4" />
            Perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/profile"
            className="flex items-center cursor-pointer px-3 py-2 text-[#94a3b8] hover:text-[#e2e8f0] focus:bg-white/[0.06] focus:text-[#e2e8f0]"
          >
            <Settings className="mr-2 h-4 w-4" />
            Configuracion
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#2d3548]" />
        <DropdownMenuItem
          className="cursor-pointer px-3 py-2 text-red-400 focus:text-red-400 focus:bg-red-500/10"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
