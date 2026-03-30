"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { registerSchema } from "@/lib/validations/auth";
import { registerUser } from "@/server/actions/auth.actions";
import { UserPlus, Eye, EyeOff } from "lucide-react";

interface FieldErrors { name?: string; email?: string; password?: string; confirmPassword?: string; rut?: string; }

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rut, setRut] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const data = { name, email, password, confirmPassword, rut: rut || undefined };
    const validation = registerSchema.safeParse(data);
    if (!validation.success) {
      const errors: FieldErrors = {};
      for (const issue of validation.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        if (!errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerUser(validation.data);
      if (!result.success) { setError(result.error ?? "Error al crear la cuenta."); return; }

      const signInResult = await signIn("credentials", { email, password, redirect: false });
      if (signInResult?.error) { router.push("/login"); return; }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Ocurrio un error inesperado. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-[#2d3548] bg-[#0f1117] px-4 py-3 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors disabled:opacity-50";

  return (
    <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] overflow-hidden">
      <div className="p-6 pb-2">
        <h2 className="text-xl font-bold text-[#e2e8f0]">Crear cuenta</h2>
        <p className="text-sm text-[#94a3b8] mt-1">
          Completa los datos para registrarte en Seguro 360
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
            <label className="text-sm font-medium text-[#e2e8f0]">Nombre completo</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Juan Perez" autoComplete="name" disabled={isLoading} className={inputClass} />
            {fieldErrors.name && <p className="text-xs text-red-400">{fieldErrors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#e2e8f0]">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com" autoComplete="email" disabled={isLoading} className={inputClass} />
            {fieldErrors.email && <p className="text-xs text-red-400">{fieldErrors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#e2e8f0]">RUT (opcional)</label>
            <input type="text" value={rut} onChange={(e) => setRut(e.target.value)}
              placeholder="12.345.678-9" disabled={isLoading} className={inputClass} />
            {fieldErrors.rut && <p className="text-xs text-red-400">{fieldErrors.rut}</p>}
            <p className="text-xs text-[#64748b]">Tu RUT se almacena de forma segura y encriptada.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#e2e8f0]">Contrasena</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="********"
                autoComplete="new-password" disabled={isLoading} className={`${inputClass} pr-10`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#94a3b8]">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && <p className="text-xs text-red-400">{fieldErrors.password}</p>}
            <p className="text-xs text-[#64748b]">Minimo 8 caracteres, una mayuscula y un numero.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#e2e8f0]">Confirmar contrasena</label>
            <input type={showPassword ? "text" : "password"} value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} placeholder="********"
              autoComplete="new-password" disabled={isLoading} className={inputClass} />
            {fieldErrors.confirmPassword && <p className="text-xs text-red-400">{fieldErrors.confirmPassword}</p>}
          </div>
        </div>

        <div className="border-t border-[#2d3548] p-6 pt-4 space-y-4 bg-[#161b22]">
          <button type="submit" disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50">
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {isLoading ? "Creando cuenta..." : "Crear cuenta"}
          </button>

          <p className="text-center text-sm text-[#94a3b8]">
            Ya tienes cuenta?{" "}
            <Link href="/login" className="font-medium text-cyan-400 hover:text-cyan-300">
              Inicia sesion
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
