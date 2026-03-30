"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { loginSchema } from "@/lib/validations/auth";
import { LogIn, Eye, EyeOff } from "lucide-react";

interface FieldErrors { email?: string; password?: string; }

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        if (!errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const signInResult = await signIn("credentials", { email, password, redirect: false });
      if (signInResult?.error) {
        setError("Credenciales incorrectas. Verifica tu email y contrasena.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Ocurrio un error inesperado. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] overflow-hidden">
      <div className="p-6 pb-2">
        <h2 className="text-xl font-bold text-[#e2e8f0]">Iniciar sesion</h2>
        <p className="text-sm text-[#94a3b8] mt-1">
          Ingresa tus credenciales para acceder a tu cuenta
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#e2e8f0]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              disabled={isLoading}
              className="w-full rounded-xl border border-[#2d3548] bg-[#0f1117] px-4 py-3 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors disabled:opacity-50"
            />
            {fieldErrors.email && <p className="text-xs text-red-400">{fieldErrors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#e2e8f0]">Contrasena</label>
              <Link href="/forgot-password" className="text-xs font-medium text-cyan-400 hover:text-cyan-300">
                Olvidaste tu contrasena?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                autoComplete="current-password"
                disabled={isLoading}
                className="w-full rounded-xl border border-[#2d3548] bg-[#0f1117] px-4 py-3 pr-10 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#94a3b8] transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && <p className="text-xs text-red-400">{fieldErrors.password}</p>}
          </div>
        </div>

        <div className="border-t border-[#2d3548] p-6 pt-4 space-y-4 bg-[#161b22]">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {isLoading ? "Ingresando..." : "Iniciar sesion"}
          </button>

          <p className="text-center text-sm text-[#94a3b8]">
            No tienes cuenta?{" "}
            <Link href="/register" className="font-medium text-cyan-400 hover:text-cyan-300">
              Registrate aqui
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
