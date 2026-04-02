"use client";

import { useState } from "react";
import { Menu, Bell } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";
import { UserButton } from "@/components/auth/user-button";

export function Topbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#2d3548] bg-[#161b22] px-4 lg:px-6">
      {/* Left side: mobile menu + page title area */}
      <div className="flex items-center gap-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu</span>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-64 p-0 bg-[#161b22] border-[#2d3548]"
            showCloseButton={false}
          >
            <SheetTitle className="sr-only">Menu de navegacion</SheetTitle>
            <Sidebar />
          </SheetContent>
        </Sheet>

        {/* Page title area */}
        <div className="hidden lg:block">
          <h2 className="text-sm font-medium text-[#94a3b8]">
            Plataforma de Seguros
          </h2>
        </div>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        {/* Notification bell */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-colors">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
          <span className="sr-only">Notificaciones</span>
        </button>

        {/* Separator */}
        <div className="mx-1 h-6 w-px bg-[#2d3548]" />

        {/* User button */}
        <UserButton />
      </div>
    </header>
  );
}
