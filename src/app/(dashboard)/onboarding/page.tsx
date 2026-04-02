"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  User,
  Users,
  Heart,
  Home,
  Car,
  FileText,
  Search,
  MessageCircle,
  Minus,
  Plus,
  X,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type Gender = "masculino" | "femenino" | "otro" | null;
type Occupation = "empleado" | "independiente" | "estudiante" | "jubilado" | null;

interface FamilyState {
  tienePareja: boolean;
  parejaAge: number;
  tieneHijos: boolean;
  cantidadHijos: number;
  edadHijos: string[];
  tieneMascotas: boolean;
  tipoMascota: string[];
  tieneVivienda: boolean;
  tieneHipotecario: boolean;
  tieneVehiculo: boolean;
  viveSolo: boolean;
}

interface InsuranceState {
  sistemasSalud: "fonasa" | "isapre" | null;
  isapreNombre: string;
  complementarioSalud: boolean;
  complementarioTipo: "empleador" | "individual" | null;
  seguroVida: boolean;
  seguroHogar: boolean;
  seguroAuto: boolean;
  seguroAccidentes: boolean;
  seguroCatastrofico: boolean;
  seguroInvalidez: boolean;
  seguroViaje: boolean;
  seguroDental: boolean;
  otroSeguro: boolean;
  noSeguro: boolean;
}

interface Gap {
  severity: "critical" | "warning";
  icon: string;
  title: string;
  reason: string;
  monthlyCost: string;
}

// ─── Score Gauge ────────────────────────────────────────────────────────────

function ScoreGauge({
  score,
  animated,
}: {
  score: number;
  animated: number;
}) {
  const radius = 110;
  const strokeWidth = 16;
  const center = 140;
  const circumference = 2 * Math.PI * radius;

  const startAngle = 135;
  const totalArc = 270;
  const arcLength = (totalArc / 360) * circumference;
  const filledLength = (animated / 100) * arcLength;
  const dashOffset = arcLength - filledLength;

  const color =
    score >= 70 ? "#22c55e" : score >= 40 ? "#eab308" : "#ef4444";
  const label =
    score >= 70
      ? "Bien protegido"
      : score >= 40
        ? "Proteccion parcial"
        : "Proteccion critica";

  return (
    <div className="relative flex items-center justify-center">
      <div
        className="absolute w-56 h-56 rounded-full blur-3xl opacity-25 transition-all duration-1000"
        style={{ backgroundColor: color }}
      />
      <svg
        width="280"
        height="280"
        viewBox="0 0 280 280"
        className="drop-shadow-2xl"
      >
        <defs>
          <linearGradient
            id="onboardGaugeGrad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color + "aa"} />
          </linearGradient>
          <filter id="onboardGlow">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(${startAngle} ${center} ${center})`}
        />

        {/* Filled arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#onboardGaugeGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(${startAngle} ${center} ${center})`}
          filter="url(#onboardGlow)"
          className="transition-all duration-[2000ms] ease-out"
        />

        {/* Score text */}
        <text
          x={center}
          y={center - 10}
          textAnchor="middle"
          dominantBaseline="central"
          className="text-5xl font-bold"
          fill={color}
          style={{ fontSize: "52px", fontWeight: 700 }}
        >
          {animated}
        </text>
        <text
          x={center}
          y={center + 28}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#94a3b8"
          style={{ fontSize: "13px" }}
        >
          de 100 puntos
        </text>
      </svg>
      <div
        className="absolute -bottom-2 text-sm font-semibold px-4 py-1.5 rounded-full border"
        style={{
          color,
          backgroundColor: color + "18",
          borderColor: color + "40",
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ─── Progress Bar ───────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs text-slate-500">
          Paso {step} de {total}
        </span>
        <span className="text-xs text-slate-500">
          {Math.round((step / total) * 100)}%
        </span>
      </div>
      <div className="h-1.5 bg-[#1c2333] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700 ease-out"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-3">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-500 ${
                i + 1 < step
                  ? "bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20"
                  : i + 1 === step
                    ? "bg-gradient-to-br from-cyan-500 to-blue-500 text-white ring-2 ring-cyan-400/40 ring-offset-2 ring-offset-[#0f1117] shadow-lg shadow-cyan-500/30"
                    : "bg-[#1c2333] text-slate-600 border border-[#2d3548]"
              }`}
            >
              {i + 1 < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span
              className={`text-[10px] hidden sm:block transition-colors ${
                i + 1 <= step ? "text-slate-300" : "text-slate-600"
              }`}
            >
              {
                ["Inicio", "Sobre ti", "Familia", "Seguros", "Resultado"][i]
              }
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step Wrapper ───────────────────────────────────────────────────────────

function StepWrapper({
  children,
  direction,
  active,
}: {
  children: React.ReactNode;
  direction: "left" | "right";
  active: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (active) {
      const t = setTimeout(() => setMounted(true), 50);
      return () => clearTimeout(t);
    } else {
      setMounted(false);
    }
  }, [active]);

  if (!active) return null;

  return (
    <div
      className={`w-full transition-all duration-500 ease-out ${
        mounted
          ? "opacity-100 translate-x-0"
          : direction === "right"
            ? "opacity-0 translate-x-16"
            : "opacity-0 -translate-x-16"
      }`}
    >
      {children}
    </div>
  );
}

// ─── Selectable Card ────────────────────────────────────────────────────────

function SelectCard({
  emoji,
  label,
  sublabel,
  selected,
  onClick,
  size = "md",
}: {
  emoji?: string;
  label: string;
  sublabel?: string;
  selected: boolean;
  onClick: () => void;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg"
      ? "p-5 min-h-[90px]"
      : size === "md"
        ? "p-4 min-h-[72px]"
        : "p-3 min-h-[56px]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-3 rounded-xl border text-left transition-all duration-300 group ${sizeClass} ${
        selected
          ? "bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-500/10"
          : "bg-[#1c2333] border-[#2d3548] hover:border-slate-500/50 hover:bg-[#232b3e]"
      }`}
    >
      {selected && (
        <div className="absolute top-2 right-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        </div>
      )}
      {emoji && <span className="text-2xl flex-shrink-0">{emoji}</span>}
      <div className="flex-1 min-w-0">
        <div
          className={`font-medium transition-colors ${
            selected ? "text-cyan-300" : "text-slate-200 group-hover:text-white"
          }`}
        >
          {label}
        </div>
        {sublabel && (
          <div className="text-xs text-slate-500 mt-0.5">{sublabel}</div>
        )}
      </div>
    </button>
  );
}

// ─── Insurance Toggle Card ──────────────────────────────────────────────────

function InsuranceCard({
  emoji,
  label,
  selected,
  onClick,
  children,
}: {
  emoji: string;
  label: string;
  selected: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        className={`w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all duration-300 ${
          selected
            ? "bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-500/5"
            : "bg-[#1c2333] border-[#2d3548] hover:border-slate-500/50 hover:bg-[#232b3e]"
        }`}
      >
        <span className="text-xl flex-shrink-0">{emoji}</span>
        <span
          className={`text-sm font-medium flex-1 ${
            selected ? "text-cyan-300" : "text-slate-300"
          }`}
        >
          {label}
        </span>
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
            selected
              ? "bg-gradient-to-br from-cyan-400 to-blue-500 border-transparent"
              : "border-slate-600"
          }`}
        >
          {selected && <Check className="w-3 h-3 text-white" />}
        </div>
      </button>
      {selected && children && (
        <div className="mt-2 ml-10 mr-2 animate-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Counter Component ──────────────────────────────────────────────────────

function Counter({
  value,
  onChange,
  min = 1,
  max = 10,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {label && <span className="text-xs text-slate-400">{label}</span>}
      <div className="flex items-center gap-2 bg-[#0f1117] rounded-lg border border-[#2d3548] px-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="p-1.5 text-slate-400 hover:text-white transition-colors disabled:opacity-30"
          disabled={value <= min}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="text-sm font-semibold text-white w-6 text-center">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="p-1.5 text-slate-400 hover:text-white transition-colors disabled:opacity-30"
          disabled={value >= max}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Gap Analysis ───────────────────────────────────────────────────────────

function calculateScore(
  age: number,
  family: FamilyState,
  insurance: InsuranceState,
  occupation: Occupation
): number {
  let score = 100;

  // No complementary health
  if (!insurance.complementarioSalud) score -= 25;

  // No life insurance
  const hasDependents = family.tienePareja || family.tieneHijos;
  if (!insurance.seguroVida && hasDependents) score -= 20;
  if (!insurance.seguroVida && !hasDependents) score -= 5;

  // No home insurance with property
  if (family.tieneVivienda && !insurance.seguroHogar) score -= 15;

  // No car insurance with vehicle
  if (family.tieneVehiculo && !insurance.seguroAuto) score -= 15;

  // No catastrophic over 40
  if (age > 40 && !insurance.seguroCatastrofico) score -= 15;

  // No disability for freelancers
  if (occupation === "independiente" && !insurance.seguroInvalidez) score -= 10;

  // No accident insurance with kids
  if (family.tieneHijos && !insurance.seguroAccidentes) score -= 5;

  return Math.max(0, score);
}

function calculateGaps(
  age: number,
  family: FamilyState,
  insurance: InsuranceState,
  occupation: Occupation
): Gap[] {
  const gaps: Gap[] = [];

  if (family.tieneHijos && !insurance.seguroVida) {
    gaps.push({
      severity: "critical",
      icon: "❤️",
      title: "Sin seguro de vida con hijos dependientes",
      reason:
        "Si algo te pasara, tus hijos quedarian sin respaldo economico para su educacion y sustento.",
      monthlyCost: "$15.000 - $40.000",
    });
  }

  if (!insurance.complementarioSalud) {
    gaps.push({
      severity: "critical",
      icon: "💊",
      title: "Sin seguro complementario de salud",
      reason:
        "Una hospitalizacion o cirugia puede costarte millones. El complementario cubre lo que FONASA/ISAPRE no.",
      monthlyCost: "$20.000 - $60.000",
    });
  }

  if (age > 50 && !insurance.seguroVida && !family.tieneHijos) {
    gaps.push({
      severity: "critical",
      icon: "❤️",
      title: "Mayor de 50 sin seguro de vida",
      reason:
        "A mayor edad, el costo del seguro de vida sube. Contratarlo ahora es mucho mas economico que despues.",
      monthlyCost: "$25.000 - $70.000",
    });
  }

  if (family.tieneVehiculo && !insurance.seguroAuto) {
    gaps.push({
      severity: "warning",
      icon: "🚗",
      title: "Solo SOAP no cubre danos a tu vehiculo",
      reason:
        "El SOAP solo cubre lesiones a terceros. Sin seguro automotriz, cualquier dano a tu auto sale de tu bolsillo.",
      monthlyCost: "$25.000 - $80.000",
    });
  }

  if (age > 40 && !insurance.seguroCatastrofico) {
    gaps.push({
      severity: "warning",
      icon: "🏥",
      title: "Sin cobertura catastrofica",
      reason:
        "Un tratamiento oncologico puede superar los $50 millones. Este seguro te protege de gastos extremos.",
      monthlyCost: "$10.000 - $30.000",
    });
  }

  if (family.tieneVivienda && !insurance.seguroHogar) {
    gaps.push({
      severity: "warning",
      icon: "🏠",
      title: "Vivienda propia sin seguro de contenido",
      reason:
        "Incendios, robos o desastres naturales pueden destruir tu patrimonio. El seguro hipotecario solo cubre la estructura.",
      monthlyCost: "$8.000 - $20.000",
    });
  }

  if (occupation === "independiente" && !insurance.seguroInvalidez) {
    gaps.push({
      severity: "warning",
      icon: "♿",
      title: "Independiente sin seguro de invalidez",
      reason:
        "Sin empleador, si no puedes trabajar no tendras ingresos. Este seguro reemplaza tu sueldo temporalmente.",
      monthlyCost: "$12.000 - $35.000",
    });
  }

  if (family.tieneHijos && !insurance.seguroAccidentes) {
    gaps.push({
      severity: "warning",
      icon: "🛡️",
      title: "Sin seguro de accidentes personales con hijos",
      reason:
        "Los ninos son propensos a accidentes. Este seguro cubre urgencias y rehabilitacion sin copago alto.",
      monthlyCost: "$5.000 - $15.000",
    });
  }

  return gaps;
}

function getCoveredItems(insurance: InsuranceState): Array<{ icon: string; label: string; desc: string }> {
  const items: Array<{ icon: string; label: string; desc: string }> = [];

  if (insurance.sistemasSalud === "fonasa") {
    items.push({
      icon: "🏥",
      label: "FONASA",
      desc: "Cobertura de salud publica basica",
    });
  }
  if (insurance.sistemasSalud === "isapre") {
    items.push({
      icon: "🏥",
      label: `ISAPRE${insurance.isapreNombre ? ` (${insurance.isapreNombre})` : ""}`,
      desc: "Plan de salud privado con copagos reducidos",
    });
  }
  if (insurance.complementarioSalud) {
    items.push({
      icon: "💊",
      label: "Complementario de salud",
      desc: "Reembolso de gastos medicos y hospitalizaciones",
    });
  }
  if (insurance.seguroVida) {
    items.push({
      icon: "❤️",
      label: "Seguro de vida",
      desc: "Proteccion economica para tus beneficiarios",
    });
  }
  if (insurance.seguroHogar) {
    items.push({
      icon: "🏠",
      label: "Seguro de hogar",
      desc: "Cobertura de contenido, incendio y robos",
    });
  }
  if (insurance.seguroAuto) {
    items.push({
      icon: "🚗",
      label: "Seguro automotriz",
      desc: "Cobertura de danos propios y a terceros",
    });
  }
  if (insurance.seguroAccidentes) {
    items.push({
      icon: "🛡️",
      label: "Seguro de accidentes",
      desc: "Cobertura ante accidentes personales",
    });
  }
  if (insurance.seguroCatastrofico) {
    items.push({
      icon: "🏥",
      label: "Seguro catastrofico",
      desc: "Proteccion ante enfermedades de alto costo",
    });
  }
  if (insurance.seguroInvalidez) {
    items.push({
      icon: "♿",
      label: "Seguro de invalidez",
      desc: "Reemplazo de ingresos por incapacidad",
    });
  }
  if (insurance.seguroViaje) {
    items.push({
      icon: "✈️",
      label: "Seguro de viaje",
      desc: "Cobertura medica y de equipaje en el extranjero",
    });
  }
  if (insurance.seguroDental) {
    items.push({
      icon: "🦷",
      label: "Seguro dental",
      desc: "Cobertura de tratamientos odontologicos",
    });
  }
  if (insurance.otroSeguro) {
    items.push({
      icon: "📦",
      label: "Otro seguro",
      desc: "Cobertura adicional contratada",
    });
  }

  return items;
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"left" | "right">("right");

  // Step 2 state
  const [age, setAge] = useState(35);
  const [gender, setGender] = useState<Gender>(null);
  const [occupation, setOccupation] = useState<Occupation>(null);

  // Step 3 state
  const [family, setFamily] = useState<FamilyState>({
    tienePareja: false,
    parejaAge: 30,
    tieneHijos: false,
    cantidadHijos: 1,
    edadHijos: [],
    tieneMascotas: false,
    tipoMascota: [],
    tieneVivienda: false,
    tieneHipotecario: false,
    tieneVehiculo: false,
    viveSolo: false,
  });

  // Step 4 state
  const [insurance, setInsurance] = useState<InsuranceState>({
    sistemasSalud: null,
    isapreNombre: "",
    complementarioSalud: false,
    complementarioTipo: null,
    seguroVida: false,
    seguroHogar: false,
    seguroAuto: false,
    seguroAccidentes: false,
    seguroCatastrofico: false,
    seguroInvalidez: false,
    seguroViaje: false,
    seguroDental: false,
    otroSeguro: false,
    noSeguro: false,
  });

  // Step 5 state
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showCovered, setShowCovered] = useState(false);
  const [showGaps, setShowGaps] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [revealedGaps, setRevealedGaps] = useState(0);
  const [revealedCovered, setRevealedCovered] = useState(0);

  const finalScore = calculateScore(age, family, insurance, occupation);
  const gaps = calculateGaps(age, family, insurance, occupation);
  const covered = getCoveredItems(insurance);

  // Count total insurance items
  const insuranceCount = [
    insurance.sistemasSalud !== null,
    insurance.complementarioSalud,
    insurance.seguroVida,
    insurance.seguroHogar,
    insurance.seguroAuto,
    insurance.seguroAccidentes,
    insurance.seguroCatastrofico,
    insurance.seguroInvalidez,
    insurance.seguroViaje,
    insurance.seguroDental,
    insurance.otroSeguro,
  ].filter(Boolean).length;

  const goNext = useCallback(() => {
    if (step < 5) {
      setDirection("right");
      setStep((s) => s + 1);
    }
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 1) {
      setDirection("left");
      setStep((s) => s - 1);
    }
  }, [step]);

  // Step 5 animations
  useEffect(() => {
    if (step !== 5) {
      setAnimatedScore(0);
      setShowCovered(false);
      setShowGaps(false);
      setShowActions(false);
      setRevealedGaps(0);
      setRevealedCovered(0);
      return;
    }

    // Animate score counter
    let frame = 0;
    const totalFrames = 60;
    const interval = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * finalScore));
      if (frame >= totalFrames) clearInterval(interval);
    }, 30);

    // Stagger sections
    const t1 = setTimeout(() => {
      setShowCovered(true);
      // Stagger covered items
      let ci = 0;
      const coveredInterval = setInterval(() => {
        ci++;
        setRevealedCovered(ci);
        if (ci >= covered.length) clearInterval(coveredInterval);
      }, 120);
    }, 1200);

    const t2 = setTimeout(() => {
      setShowGaps(true);
      // Stagger gap items
      let gi = 0;
      const gapInterval = setInterval(() => {
        gi++;
        setRevealedGaps(gi);
        if (gi >= gaps.length) clearInterval(gapInterval);
      }, 200);
    }, 1800);

    const t3 = setTimeout(() => setShowActions(true), 2600);

    return () => {
      clearInterval(interval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [step, finalScore, gaps.length, covered.length]);

  const updateFamily = (partial: Partial<FamilyState>) => {
    setFamily((prev) => {
      const next = { ...prev, ...partial };
      // "Vivo solo" logic: deselects pareja/hijos/mascotas
      if (partial.viveSolo && partial.viveSolo === true) {
        next.tienePareja = false;
        next.tieneHijos = false;
        next.tieneMascotas = false;
      }
      // If selecting pareja/hijos/mascotas, uncheck viveSolo
      if (partial.tienePareja || partial.tieneHijos || partial.tieneMascotas) {
        next.viveSolo = false;
      }
      return next;
    });
  };

  const updateInsurance = (partial: Partial<InsuranceState>) => {
    setInsurance((prev) => ({ ...prev, ...partial }));
  };

  // Check if step 2 is complete enough to proceed
  const canProceedStep2 = gender !== null && occupation !== null;

  const edadHijosOptions = [
    "Menores de 5",
    "5-12 anos",
    "13-17 anos",
    "Mayores de 18",
  ];

  const mascotaOptions = ["Perro", "Gato", "Otro"];

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center">
      {/* Progress Bar */}
      <div className="w-full max-w-3xl pt-4 pb-6 px-4">
        <ProgressBar step={step} total={5} />
      </div>

      {/* Step Content */}
      <div className="flex-1 w-full max-w-2xl px-4 pb-8 overflow-y-auto">
        {/* ────────── STEP 1: Welcome ────────── */}
        <StepWrapper direction={direction} active={step === 1}>
          <div className="flex flex-col items-center justify-center text-center py-8">
            {/* Animated shield */}
            <div className="relative mb-8">
              <div className="absolute inset-0 w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 blur-2xl animate-pulse" />
              <div className="relative w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 flex items-center justify-center">
                  <Shield className="w-12 h-12 text-cyan-400" />
                </div>
              </div>
              {/* Orbiting dots */}
              <div className="absolute inset-0 w-32 h-32 mx-auto animate-[spin_8s_linear_infinite]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
              </div>
              <div className="absolute inset-0 w-32 h-32 mx-auto animate-[spin_12s_linear_infinite_reverse]">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50" />
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Bienvenido/a a{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Seguro 360
              </span>
            </h1>
            <p className="text-slate-400 text-base sm:text-lg max-w-md leading-relaxed mb-2">
              En los proximos 2 minutos vamos a hacer un{" "}
              <span className="text-slate-200 font-medium">
                diagnostico rapido
              </span>{" "}
              de tu proteccion.
            </p>
            <p className="text-slate-500 text-sm max-w-sm mb-10">
              No necesitas tus polizas a mano — las puedes subir despues.
            </p>

            <button
              onClick={goNext}
              className="group relative inline-flex items-center gap-3 px-10 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              <span>Comenzar</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              {/* Shimmer */}
              <div className="absolute inset-0 rounded-xl overflow-hidden">
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
            </button>

            <p className="text-slate-600 text-xs mt-6 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Solo 5 preguntas simples
            </p>
          </div>
        </StepWrapper>

        {/* ────────── STEP 2: About You ────────── */}
        <StepWrapper direction={direction} active={step === 2}>
          <div className="space-y-8 py-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Sobre ti
              </h2>
              <p className="text-slate-400">
                Cuentanos sobre ti para personalizar tu diagnostico
              </p>
            </div>

            {/* Age */}
            <div className="bg-[#1c2333] rounded-xl border border-[#2d3548] p-6">
              <label className="block text-sm font-medium text-slate-300 mb-4">
                Edad:{" "}
                <span className="text-2xl font-bold text-white ml-1">
                  {age}
                </span>{" "}
                <span className="text-slate-500 text-sm">anos</span>
              </label>
              <input
                type="range"
                min={18}
                max={80}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none bg-[#2d3548] cursor-pointer accent-cyan-500
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br
                  [&::-webkit-slider-thumb]:from-cyan-400 [&::-webkit-slider-thumb]:to-blue-500
                  [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-cyan-500/30
                  [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:border-white/20
                  [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6
                  [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gradient-to-br
                  [&::-moz-range-thumb]:from-cyan-400 [&::-moz-range-thumb]:to-blue-500
                  [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:border-2
                  [&::-moz-range-thumb]:border-white/20 [&::-moz-range-thumb]:cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>18</span>
                <span>80</span>
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Genero
              </label>
              <div className="grid grid-cols-3 gap-3">
                <SelectCard
                  emoji="👨"
                  label="Masculino"
                  selected={gender === "masculino"}
                  onClick={() => setGender("masculino")}
                />
                <SelectCard
                  emoji="👩"
                  label="Femenino"
                  selected={gender === "femenino"}
                  onClick={() => setGender("femenino")}
                />
                <SelectCard
                  emoji="🧑"
                  label="Otro"
                  selected={gender === "otro"}
                  onClick={() => setGender("otro")}
                />
              </div>
            </div>

            {/* Occupation */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Ocupacion
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SelectCard
                  emoji="💼"
                  label="Empleado dependiente"
                  sublabel="Tiene beneficios del empleador"
                  selected={occupation === "empleado"}
                  onClick={() => setOccupation("empleado")}
                  size="lg"
                />
                <SelectCard
                  emoji="🏢"
                  label="Independiente / emprendedor"
                  sublabel="Trabaja por cuenta propia"
                  selected={occupation === "independiente"}
                  onClick={() => setOccupation("independiente")}
                  size="lg"
                />
                <SelectCard
                  emoji="👨‍🎓"
                  label="Estudiante"
                  sublabel="Estudios de pre o postgrado"
                  selected={occupation === "estudiante"}
                  onClick={() => setOccupation("estudiante")}
                  size="lg"
                />
                <SelectCard
                  emoji="🏖️"
                  label="Jubilado/pensionado"
                  sublabel="Retirado del mercado laboral"
                  selected={occupation === "jubilado"}
                  onClick={() => setOccupation("jubilado")}
                  size="lg"
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors px-4 py-2.5 rounded-lg hover:bg-[#1c2333]"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Atras</span>
              </button>
              <button
                onClick={goNext}
                disabled={!canProceedStep2}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-cyan-500/20"
              >
                <span>Continuar</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </StepWrapper>

        {/* ────────── STEP 3: Family ────────── */}
        <StepWrapper direction={direction} active={step === 3}>
          <div className="space-y-5 py-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Tu familia
              </h2>
              <p className="text-slate-400">
                ¿Con quien vives?
              </p>
            </div>

            <div className="space-y-3">
              {/* Pareja */}
              <div>
                <SelectCard
                  emoji="💑"
                  label="Tengo pareja / conyuge"
                  selected={family.tienePareja}
                  onClick={() => updateFamily({ tienePareja: !family.tienePareja })}
                  size="lg"
                />
                {family.tienePareja && (
                  <div className="mt-2 ml-12 mr-4 bg-[#0f1117] rounded-lg border border-[#2d3548] p-3 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-xs text-slate-400 block mb-2">
                      Edad de tu pareja:{" "}
                      <span className="text-white font-semibold">
                        {family.parejaAge}
                      </span>
                    </label>
                    <input
                      type="range"
                      min={18}
                      max={80}
                      value={family.parejaAge}
                      onChange={(e) =>
                        updateFamily({ parejaAge: Number(e.target.value) })
                      }
                      className="w-full h-1.5 rounded-full appearance-none bg-[#2d3548] cursor-pointer accent-cyan-500
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4
                        [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-cyan-500
                        [&::-moz-range-thumb]:cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Hijos */}
              <div>
                <SelectCard
                  emoji="👶"
                  label="Tengo hijos"
                  selected={family.tieneHijos}
                  onClick={() => updateFamily({ tieneHijos: !family.tieneHijos })}
                  size="lg"
                />
                {family.tieneHijos && (
                  <div className="mt-2 ml-12 mr-4 bg-[#0f1117] rounded-lg border border-[#2d3548] p-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
                    <Counter
                      label="¿Cuantos?"
                      value={family.cantidadHijos}
                      onChange={(v) => updateFamily({ cantidadHijos: v })}
                      min={1}
                      max={10}
                    />
                    <div>
                      <span className="text-xs text-slate-400 block mb-2">
                        Rango de edades (selecciona todos los que apliquen)
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {edadHijosOptions.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              const has = family.edadHijos.includes(opt);
                              updateFamily({
                                edadHijos: has
                                  ? family.edadHijos.filter((o) => o !== opt)
                                  : [...family.edadHijos, opt],
                              });
                            }}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                              family.edadHijos.includes(opt)
                                ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                                : "bg-[#1c2333] border-[#2d3548] text-slate-400 hover:border-slate-500"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mascotas */}
              <div>
                <SelectCard
                  emoji="🐾"
                  label="Tengo mascotas"
                  selected={family.tieneMascotas}
                  onClick={() =>
                    updateFamily({ tieneMascotas: !family.tieneMascotas })
                  }
                  size="lg"
                />
                {family.tieneMascotas && (
                  <div className="mt-2 ml-12 mr-4 bg-[#0f1117] rounded-lg border border-[#2d3548] p-3 animate-in slide-in-from-top-2 duration-300">
                    <span className="text-xs text-slate-400 block mb-2">
                      Tipo de mascota
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {mascotaOptions.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            const has = family.tipoMascota.includes(opt);
                            updateFamily({
                              tipoMascota: has
                                ? family.tipoMascota.filter((o) => o !== opt)
                                : [...family.tipoMascota, opt],
                            });
                          }}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                            family.tipoMascota.includes(opt)
                              ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                              : "bg-[#1c2333] border-[#2d3548] text-slate-400 hover:border-slate-500"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Vivienda */}
              <div>
                <SelectCard
                  emoji="🏠"
                  label="Tengo vivienda propia"
                  selected={family.tieneVivienda}
                  onClick={() =>
                    updateFamily({ tieneVivienda: !family.tieneVivienda })
                  }
                  size="lg"
                />
                {family.tieneVivienda && (
                  <div className="mt-2 ml-12 mr-4 animate-in slide-in-from-top-2 duration-300">
                    <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-slate-300 transition-colors">
                      <input
                        type="checkbox"
                        checked={family.tieneHipotecario}
                        onChange={(e) =>
                          updateFamily({ tieneHipotecario: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-[#2d3548] bg-[#0f1117] text-cyan-500 focus:ring-cyan-500/50 accent-cyan-500"
                      />
                      Con credito hipotecario vigente
                    </label>
                  </div>
                )}
              </div>

              {/* Vehiculo */}
              <SelectCard
                emoji="🚗"
                label="Tengo vehiculo"
                selected={family.tieneVehiculo}
                onClick={() =>
                  updateFamily({ tieneVehiculo: !family.tieneVehiculo })
                }
                size="lg"
              />

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#2d3548]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#0f1117] px-3 text-xs text-slate-600">
                    o
                  </span>
                </div>
              </div>

              {/* Vivo solo */}
              <SelectCard
                emoji="🙋"
                label="Vivo solo/a"
                sublabel="Puedes igual tener vivienda o vehiculo"
                selected={family.viveSolo}
                onClick={() => updateFamily({ viveSolo: !family.viveSolo })}
                size="lg"
              />
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors px-4 py-2.5 rounded-lg hover:bg-[#1c2333]"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Atras</span>
              </button>
              <button
                onClick={goNext}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                <span>Continuar</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </StepWrapper>

        {/* ────────── STEP 4: Current Insurance ────────── */}
        <StepWrapper direction={direction} active={step === 4}>
          <div className="space-y-5 py-4">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white mb-2">
                Tus seguros actuales
              </h2>
              <p className="text-slate-400">
                ¿Que seguros tienes actualmente? Marca los que apliquen
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* FONASA / ISAPRE radio */}
              <div className="sm:col-span-2">
                <span className="text-xs text-slate-500 block mb-2 ml-1">
                  Sistema de salud
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <InsuranceCard
                    emoji="🏥"
                    label="FONASA"
                    selected={insurance.sistemasSalud === "fonasa"}
                    onClick={() =>
                      updateInsurance({
                        sistemasSalud:
                          insurance.sistemasSalud === "fonasa"
                            ? null
                            : "fonasa",
                      })
                    }
                  />
                  <InsuranceCard
                    emoji="🏥"
                    label="ISAPRE"
                    selected={insurance.sistemasSalud === "isapre"}
                    onClick={() =>
                      updateInsurance({
                        sistemasSalud:
                          insurance.sistemasSalud === "isapre"
                            ? null
                            : "isapre",
                      })
                    }
                  >
                    <input
                      type="text"
                      placeholder="Nombre de tu ISAPRE"
                      value={insurance.isapreNombre}
                      onChange={(e) =>
                        updateInsurance({ isapreNombre: e.target.value })
                      }
                      className="w-full text-xs bg-[#0f1117] border border-[#2d3548] rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                    />
                  </InsuranceCard>
                </div>
              </div>

              {/* Complementario */}
              <div className="sm:col-span-2">
                <InsuranceCard
                  emoji="💊"
                  label="Seguro complementario de salud"
                  selected={insurance.complementarioSalud}
                  onClick={() =>
                    updateInsurance({
                      complementarioSalud: !insurance.complementarioSalud,
                    })
                  }
                >
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateInsurance({ complementarioTipo: "empleador" })
                      }
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        insurance.complementarioTipo === "empleador"
                          ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                          : "bg-[#1c2333] border-[#2d3548] text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      Del empleador
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateInsurance({ complementarioTipo: "individual" })
                      }
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        insurance.complementarioTipo === "individual"
                          ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                          : "bg-[#1c2333] border-[#2d3548] text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      Individual
                    </button>
                  </div>
                </InsuranceCard>
              </div>

              {/* Rest of insurance types */}
              <InsuranceCard
                emoji="❤️"
                label="Seguro de vida"
                selected={insurance.seguroVida}
                onClick={() =>
                  updateInsurance({ seguroVida: !insurance.seguroVida })
                }
              />
              <InsuranceCard
                emoji="🏠"
                label="Seguro de hogar"
                selected={insurance.seguroHogar}
                onClick={() =>
                  updateInsurance({ seguroHogar: !insurance.seguroHogar })
                }
              />
              <InsuranceCard
                emoji="🚗"
                label="Seguro automotriz"
                selected={insurance.seguroAuto}
                onClick={() =>
                  updateInsurance({ seguroAuto: !insurance.seguroAuto })
                }
              />
              <InsuranceCard
                emoji="🛡️"
                label="Accidentes personales"
                selected={insurance.seguroAccidentes}
                onClick={() =>
                  updateInsurance({
                    seguroAccidentes: !insurance.seguroAccidentes,
                  })
                }
              />
              <InsuranceCard
                emoji="🏥"
                label="Catastrofico / oncologico"
                selected={insurance.seguroCatastrofico}
                onClick={() =>
                  updateInsurance({
                    seguroCatastrofico: !insurance.seguroCatastrofico,
                  })
                }
              />
              <InsuranceCard
                emoji="♿"
                label="Seguro de invalidez"
                selected={insurance.seguroInvalidez}
                onClick={() =>
                  updateInsurance({
                    seguroInvalidez: !insurance.seguroInvalidez,
                  })
                }
              />
              <InsuranceCard
                emoji="✈️"
                label="Seguro de viaje"
                selected={insurance.seguroViaje}
                onClick={() =>
                  updateInsurance({ seguroViaje: !insurance.seguroViaje })
                }
              />
              <InsuranceCard
                emoji="🦷"
                label="Seguro dental"
                selected={insurance.seguroDental}
                onClick={() =>
                  updateInsurance({ seguroDental: !insurance.seguroDental })
                }
              />
              <InsuranceCard
                emoji="📦"
                label="Otro seguro"
                selected={insurance.otroSeguro}
                onClick={() =>
                  updateInsurance({ otroSeguro: !insurance.otroSeguro })
                }
              />
            </div>

            {/* Not sure checkbox */}
            <div className="mt-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={insurance.noSeguro}
                  onChange={(e) =>
                    updateInsurance({ noSeguro: e.target.checked })
                  }
                  className="mt-0.5 w-4 h-4 rounded border-[#2d3548] bg-[#0f1117] text-cyan-500 focus:ring-cyan-500/50 accent-cyan-500"
                />
                <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                  No estoy seguro/a de todos mis seguros
                </span>
              </label>
              {insurance.noSeguro && (
                <div className="mt-2 ml-7 text-xs text-slate-500 bg-cyan-500/5 border border-cyan-500/10 rounded-lg p-3 animate-in slide-in-from-top-2 duration-300">
                  <Sparkles className="w-3.5 h-3.5 inline mr-1 text-cyan-400" />
                  No te preocupes — cuando subas tus polizas, nuestro sistema las
                  analizara automaticamente y completara esta informacion.
                </div>
              )}
            </div>

            {/* Counter */}
            <div className="bg-[#1c2333] rounded-xl border border-[#2d3548] p-4 text-center">
              <span className="text-sm text-slate-400">
                Tienes{" "}
                <span className="text-xl font-bold text-white">
                  {insuranceCount}
                </span>{" "}
                {insuranceCount === 1
                  ? "seguro identificado"
                  : "seguros identificados"}
              </span>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors px-4 py-2.5 rounded-lg hover:bg-[#1c2333]"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Atras</span>
              </button>
              <button
                onClick={goNext}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                <span>Ver mi diagnostico</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        </StepWrapper>

        {/* ────────── STEP 5: Results ────────── */}
        <StepWrapper direction={direction} active={step === 5}>
          <div className="space-y-8 py-4">
            <div className="text-center mb-2">
              <h2 className="text-2xl font-bold text-white mb-2">
                Tu diagnostico preliminar
              </h2>
              <p className="text-slate-400 text-sm">
                Basado en tus respuestas, este es tu nivel de proteccion
              </p>
            </div>

            {/* Score Gauge */}
            <div className="flex justify-center py-4">
              <ScoreGauge score={finalScore} animated={animatedScore} />
            </div>

            {/* ── Covered Section ── */}
            {showCovered && covered.length > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Lo que tienes cubierto
                  </h3>
                  <span className="text-xs text-slate-500 ml-auto">
                    {covered.length}{" "}
                    {covered.length === 1 ? "seguro" : "seguros"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {covered.map((item, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 bg-green-500/5 border border-green-500/20 rounded-xl p-3.5 transition-all duration-500 ${
                        i < revealedCovered
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-4"
                      }`}
                    >
                      <span className="text-lg flex-shrink-0 mt-0.5">
                        {item.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-green-300">
                          {item.label}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.desc}
                        </div>
                      </div>
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Gaps Section ── */}
            {showGaps && gaps.length > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Brechas detectadas
                  </h3>
                  <span className="text-xs text-slate-500 ml-auto">
                    {gaps.length}{" "}
                    {gaps.length === 1 ? "brecha" : "brechas"}
                  </span>
                </div>
                <div className="space-y-3">
                  {gaps.map((gap, i) => (
                    <div
                      key={i}
                      className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-500 ${
                        i < revealedGaps
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 translate-x-8"
                      } ${
                        gap.severity === "critical"
                          ? "bg-red-500/5 border-red-500/30"
                          : "bg-amber-500/5 border-amber-500/30"
                      }`}
                    >
                      {/* Severity badge */}
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0 mt-0.5">
                          {gap.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                gap.severity === "critical"
                                  ? "bg-red-500/20 text-red-400 border border-red-500/40"
                                  : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                              }`}
                            >
                              {gap.severity === "critical"
                                ? "CRITICO"
                                : "ADVERTENCIA"}
                            </span>
                          </div>
                          <div
                            className={`text-sm font-medium mt-1.5 ${
                              gap.severity === "critical"
                                ? "text-red-300"
                                : "text-amber-300"
                            }`}
                          >
                            {gap.title}
                          </div>
                          <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {gap.reason}
                          </div>
                          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                            <span className="text-slate-600">
                              Costo estimado:
                            </span>
                            <span className="text-cyan-400 font-medium">
                              {gap.monthlyCost}/mes
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Pulse line for critical */}
                      {gap.severity === "critical" && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-full">
                          <div className="absolute inset-0 bg-red-400 animate-pulse rounded-full" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── No Gaps Message ── */}
            {showGaps && gaps.length === 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-6">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-green-300 font-medium">
                  ¡Excelente! No detectamos brechas criticas
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  Sube tus polizas para un analisis mas detallado
                </p>
              </div>
            )}

            {/* ── Actions Section ── */}
            {showActions && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Que hacer ahora
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => router.push("/documents")}
                    className="group bg-[#1c2333] border border-[#2d3548] rounded-xl p-5 text-left hover:border-cyan-500/30 hover:bg-[#232b3e] transition-all duration-300"
                  >
                    <div className="text-2xl mb-3">📄</div>
                    <div className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                      Subir mis polizas
                    </div>
                    <div className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Sube tus polizas para un analisis detallado de coberturas,
                      exclusiones y topes
                    </div>
                    <div className="flex items-center gap-1 text-cyan-500 text-xs mt-3 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Ir a documentos</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </button>

                  <button
                    onClick={() => router.push("/simulate")}
                    className="group bg-[#1c2333] border border-[#2d3548] rounded-xl p-5 text-left hover:border-cyan-500/30 hover:bg-[#232b3e] transition-all duration-300"
                  >
                    <div className="text-2xl mb-3">🔍</div>
                    <div className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                      Simular un escenario
                    </div>
                    <div className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Prueba que pasaria si te operan o tienes un accidente
                    </div>
                    <div className="flex items-center gap-1 text-cyan-500 text-xs mt-3 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Ir a simulador</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </button>

                  <button
                    onClick={() => router.push("/chat")}
                    className="group bg-[#1c2333] border border-[#2d3548] rounded-xl p-5 text-left hover:border-cyan-500/30 hover:bg-[#232b3e] transition-all duration-300"
                  >
                    <div className="text-2xl mb-3">💬</div>
                    <div className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                      Preguntarle a la IA
                    </div>
                    <div className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Consultale al asistente sobre tus dudas de seguros
                    </div>
                    <div className="flex items-center gap-1 text-cyan-500 text-xs mt-3 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Ir al chat</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </button>
                </div>

                {/* Final CTA */}
                <div className="text-center mt-8 pb-4">
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="group relative inline-flex items-center gap-3 px-10 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                  >
                    <span>Ir a mi dashboard</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    <div className="absolute inset-0 rounded-xl overflow-hidden">
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>
                  </button>
                  <p className="text-slate-600 text-xs mt-4">
                    Podras volver a este diagnostico en cualquier momento
                  </p>
                </div>
              </div>
            )}

            {/* Back button (only before actions show) */}
            {!showActions && (
              <div className="flex items-center pt-2">
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors px-4 py-2.5 rounded-lg hover:bg-[#1c2333]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-sm">Atras</span>
                </button>
              </div>
            )}

            {/* Back button after actions show */}
            {showActions && (
              <div className="flex items-center justify-center">
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Volver a editar respuestas</span>
                </button>
              </div>
            )}
          </div>
        </StepWrapper>
      </div>
    </div>
  );
}
