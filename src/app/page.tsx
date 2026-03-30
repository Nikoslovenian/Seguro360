"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user) router.push("/dashboard");
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1117]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0f1117] text-[#e2e8f0]">
      {/* ─── HEADER ─── */}
      <header className="border-b border-[#2d3548]/50 backdrop-blur-md bg-[#0f1117]/80 sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold text-[10px] shadow-lg shadow-cyan-500/20">
              360
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Seguro 360
            </span>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-medium text-[#94a3b8] transition-colors hover:text-white">
              Iniciar sesion
            </Link>
            <Link href="/register" className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-cyan-500/25">
              Comenzar gratis
            </Link>
          </nav>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px]" />
        <div className="absolute top-40 right-1/4 h-72 w-72 rounded-full bg-blue-600/10 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-16 lg:pt-28 lg:pb-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-sm font-medium text-cyan-400">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Plataforma inteligente de seguros en Chile
            </div>

            <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Sabes realmente{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                que cubren tus seguros?
              </span>
            </h1>

            <p className="mx-auto mb-5 max-w-2xl text-lg text-[#94a3b8] sm:text-xl leading-relaxed">
              La mayoria de los chilenos tiene multiples polizas de seguro y no sabe
              que cubre cada una, ni en que orden se activan ante un siniestro.
            </p>

            <p className="mx-auto mb-10 max-w-2xl text-base text-[#94a3b8]">
              <strong className="text-[#e2e8f0]">Seguro 360</strong> consolida todas tus polizas,
              te muestra tus brechas de cobertura y simula escenarios reales
              para que sepas <strong className="text-[#e2e8f0]">exactamente cuanto saldria de tu bolsillo</strong>.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register" className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-[1.02]">
                Comenzar gratis
              </Link>
              <Link href="#como-funciona" className="w-full sm:w-auto rounded-xl border border-[#2d3548] bg-[#1c2333] px-8 py-3.5 text-base font-semibold text-[#e2e8f0] transition-all hover:border-[#3d4a63] hover:bg-[#232b3d]">
                Como funciona
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PROBLEMA ─── */}
      <section className="border-t border-[#2d3548]/50 bg-[#161b22]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">
              El problema que nadie resuelve
            </h2>
            <p className="text-[#94a3b8] max-w-2xl mx-auto">
              En Chile, una familia promedio tiene entre 4 y 8 seguros distintos sin saberlo.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <ProblemCard
              emoji="🔍"
              title="No sabes que tienes"
              description="Seguro de salud de la ISAPRE, complementario del trabajo, seguro de vida del credito hipotecario, SOAP, seguro de la tarjeta de credito... Cada uno con condiciones distintas."
            />
            <ProblemCard
              emoji="🤷"
              title="No sabes que te cubre"
              description="Si te operan de la rodilla por $4.500.000, ¿cuanto sale de tu bolsillo? ¿La ISAPRE paga primero? ¿El complementario cubre el copago? Nadie te lo explica claro."
            />
            <ProblemCard
              emoji="💸"
              title="Pagas de mas o quedas descubierto"
              description="Puede que estes pagando dos seguros que cubren lo mismo, o peor: que no tengas cobertura alguna en un area critica como invalidez o enfermedades catastroficas."
            />
          </div>
        </div>
      </section>

      {/* ─── COMO FUNCIONA ─── */}
      <section id="como-funciona" className="border-t border-[#2d3548]/50">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">
              Asi funciona{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Seguro 360
              </span>
            </h2>
            <p className="text-[#94a3b8] max-w-xl mx-auto">
              En 3 pasos tienes una vision completa de tu proteccion
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <StepCard
              step={1}
              color="cyan"
              title="Sube tus polizas"
              description="Carga los PDF de tus polizas, certificados o condiciones generales. Nuestra IA extrae automaticamente coberturas, exclusiones, deducibles, topes y copagos."
              detail="Soporta ISAPRE, seguros complementarios, vida, hogar, vehiculo, viaje y mas."
            />
            <StepCard
              step={2}
              color="blue"
              title="Ve tu mapa de proteccion"
              description="Un dashboard visual te muestra tu nivel de cobertura en cada area: salud, hogar, vehiculo, vida, accidentes. Con semaforo verde, amarillo o rojo."
              detail="Detecta brechas, duplicidades y polizas por vencer automaticamente."
            />
            <StepCard
              step={3}
              color="purple"
              title="Simula y pregunta"
              description="Simula un evento real: '¿Si me operan por $4.5M, cuanto pago de mi bolsillo?'. Ve el orden exacto de cobertura: FONASA/ISAPRE primero, complementario despues."
              detail="Consulta con IA sobre cualquier duda de tus polizas con citas al documento."
            />
          </div>
        </div>
      </section>

      {/* ─── POR QUE IMPORTA ─── */}
      <section className="border-t border-[#2d3548]/50 bg-[#161b22]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">
              Por que necesitas una vision 360 de tus seguros
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <ReasonCard
              icon="🏥"
              stat="$2.800.000"
              label="Gasto promedio cirugia ambulatoria"
              text="Sin seguro complementario, el copago de la ISAPRE puede ser el 30% o mas."
            />
            <ReasonCard
              icon="🚗"
              stat="45%"
              label="Chilenos sin seguro automotriz completo"
              text="Solo tienen SOAP obligatorio, que no cubre dano al propio vehiculo."
            />
            <ReasonCard
              icon="🏠"
              stat="70%"
              label="Hogares sin seguro de contenido"
              text="El seguro del credito hipotecario generalmente solo cubre incendio y terremoto."
            />
            <ReasonCard
              icon="👨‍👩‍👧‍👦"
              stat="6 de 10"
              label="Familias sin seguro de vida adecuado"
              text="El seguro del credito solo cubre la deuda, no el sustento familiar."
            />
          </div>
        </div>
      </section>

      {/* ─── EJEMPLO REAL ─── */}
      <section className="border-t border-[#2d3548]/50">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-8 lg:p-10">
            <h3 className="text-xl font-bold mb-6 text-center">
              Ejemplo: Cirugia de rodilla por $4.500.000
            </h3>

            <WaterfallExample />

            <p className="text-center text-sm text-[#94a3b8] mt-6">
              Con <strong className="text-[#e2e8f0]">Seguro 360</strong> ves este desglose{" "}
              <strong className="text-cyan-400">antes</strong> de operarte, no despues.
            </p>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="border-t border-[#2d3548]/50 bg-gradient-to-b from-[#161b22] to-[#0f1117]">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Toma el control de tus seguros hoy
          </h2>
          <p className="text-[#94a3b8] mb-8 max-w-xl mx-auto">
            Registrate gratis, sube tus polizas y descubre en minutos
            si estas protegido o expuesto.
          </p>
          <Link href="/register" className="inline-flex rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-[1.02]">
            Crear cuenta gratis
          </Link>
          <p className="mt-4 text-xs text-[#64748b]">
            Sin tarjeta de credito. Tus datos estan protegidos y encriptados.
          </p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-[#2d3548]/50 py-8">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold text-[8px]">
              360
            </div>
            <span className="text-sm font-semibold text-[#94a3b8]">Seguro 360</span>
          </div>
          <p className="text-xs text-[#64748b]">
            &copy; {new Date().getFullYear()} Seguro 360. Todos los derechos reservados. No reemplaza asesoria profesional de seguros.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProblemCard({ emoji, title, description }: { emoji: string; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-6 hover:border-[#3d4a63] transition-colors">
      <span className="text-3xl mb-4 block">{emoji}</span>
      <h3 className="text-lg font-semibold mb-2 text-[#e2e8f0]">{title}</h3>
      <p className="text-sm text-[#94a3b8] leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ step, color, title, description, detail }: {
  step: number; color: string; title: string; description: string; detail: string;
}) {
  const gradients: Record<string, string> = {
    cyan: "from-cyan-500 to-cyan-600",
    blue: "from-blue-500 to-blue-600",
    purple: "from-purple-500 to-purple-600",
  };
  const glows: Record<string, string> = {
    cyan: "shadow-cyan-500/20",
    blue: "shadow-blue-500/20",
    purple: "shadow-purple-500/20",
  };
  return (
    <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-6 hover:border-[#3d4a63] transition-colors">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradients[color]} text-white font-bold text-sm shadow-lg ${glows[color]}`}>
        {step}
      </div>
      <h3 className="text-lg font-semibold mb-2 text-[#e2e8f0]">{title}</h3>
      <p className="text-sm text-[#94a3b8] leading-relaxed mb-3">{description}</p>
      <p className="text-xs text-[#64748b] leading-relaxed">{detail}</p>
    </div>
  );
}

function ReasonCard({ icon, stat, label, text }: {
  icon: string; stat: string; label: string; text: string;
}) {
  return (
    <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-5 hover:border-[#3d4a63] transition-colors">
      <span className="text-2xl block mb-3">{icon}</span>
      <p className="text-2xl font-bold text-cyan-400 mb-1">{stat}</p>
      <p className="text-xs font-medium text-[#e2e8f0] mb-2">{label}</p>
      <p className="text-xs text-[#94a3b8] leading-relaxed">{text}</p>
    </div>
  );
}

function WaterfallExample() {
  const steps = [
    { label: "Costo cirugia", amount: 4500000, color: "#e2e8f0", type: "total" as const },
    { label: "ISAPRE bonifica 70%", amount: -3150000, color: "#3b82f6", type: "cover" as const },
    { label: "Queda copago", amount: 1350000, color: "#f59e0b", type: "subtotal" as const },
    { label: "Complementario MetLife", amount: -880000, color: "#06b6d4", type: "cover" as const },
    { label: "Tu bolsillo final", amount: 470000, color: "#ef4444", type: "total" as const },
  ];

  return (
    <div className="space-y-3">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="w-48 text-right">
            <span className="text-sm text-[#94a3b8]">{s.label}</span>
          </div>
          <div className="flex-1">
            <div className="h-8 rounded-lg overflow-hidden bg-[#0f1117] flex items-center">
              <div
                className="h-full rounded-lg flex items-center justify-end px-3 transition-all duration-1000"
                style={{
                  width: `${Math.abs(s.amount) / 45000}%`,
                  backgroundColor: s.color,
                  opacity: s.type === "cover" ? 0.8 : 1,
                }}
              >
                <span className="text-xs font-bold text-white whitespace-nowrap">
                  {s.type === "cover" ? "-" : ""}${(Math.abs(s.amount)).toLocaleString("es-CL")}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
