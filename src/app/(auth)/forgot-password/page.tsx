"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError("Ingresa un email valido");
      return;
    }

    setIsLoading(true);
    // Simulate sending email (in production, call API)
    setTimeout(() => {
      setSent(true);
      setIsLoading(false);
    }, 1500);
  };

  if (sent) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-[#e2e8f0] mb-2">
            Correo enviado
          </h2>
          <p className="text-sm text-[#94a3b8] mb-2">
            Si existe una cuenta asociada a <strong className="text-[#e2e8f0]">{email}</strong>,
            recibiras un enlace para restablecer tu contrasena.
          </p>
          <p className="text-xs text-[#64748b] mb-6">
            Revisa tu bandeja de entrada y carpeta de spam. El enlace expira en 1 hora.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="w-full rounded-xl border border-[#2d3548] bg-[#0f1117] px-4 py-2.5 text-sm font-medium text-[#94a3b8] hover:text-[#e2e8f0] hover:border-[#3d4a63] transition-colors"
            >
              Enviar a otro email
            </button>
            <Link
              href="/login"
              className="block w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white text-center hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
            >
              Volver a iniciar sesion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-[#94a3b8] hover:text-[#e2e8f0] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al login
        </Link>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-4">
          <Mail className="h-6 w-6 text-white" />
        </div>

        <h2 className="text-xl font-bold text-[#e2e8f0] mb-1">
          Recuperar contrasena
        </h2>
        <p className="text-sm text-[#94a3b8] mb-6">
          Ingresa el email asociado a tu cuenta y te enviaremos un enlace para restablecer tu contrasena.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#e2e8f0]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              className="w-full rounded-xl border border-[#2d3548] bg-[#0f1117] px-4 py-3 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50"
          >
            {isLoading ? "Enviando..." : "Enviar enlace de recuperacion"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#64748b]">
          Recordaste tu contrasena?{" "}
          <Link href="/login" className="font-medium text-cyan-400 hover:text-cyan-300">
            Inicia sesion
          </Link>
        </p>
      </div>
    </div>
  );
}
