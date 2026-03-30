"use client";

import { useState } from "react";
import {
  Calculator,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  RotateCcw,
  Heart,
  Car,
  Home,
  Plane,
  ChevronRight,
  ArrowDown,
  Sparkles,
  Clock,
} from "lucide-react";
import {
  detectGESPathology,
  getGESCopayPercent,
  calculateCAEC,
  CAEC_DEDUCTIBLE_CLP,
  type GESPathology,
  type HealthSystemType,
} from "@/lib/ges-auge";

// ─── Types ───────────────────────────────────────────────────────────────────

interface WaterfallStep {
  label: string;
  entity: string;
  amountIn: number;
  covers: number;
  remainder: number;
  deductible: number;
  copayPercent: number;
  copayAmount: number;
  color: string;
  note?: string;
}

interface SimResult {
  eventAmount: number;
  steps: WaterfallStep[];
  totalCovered: number;
  totalOutOfPocket: number;
  coveragePercent: number;
  confidence: "Alta" | "Media" | "Baja";
  warnings: string[];
  explanation: string;
}

// ─── User's Policies (same as Mis Seguros) ───────────────────────────────────

interface UserPolicy {
  id: string;
  name: string;
  company: string;
  category: string;
  status: string;
  coverageLimit: number;
  deductible: number;
  copayPercent: number; // what the USER pays (e.g. 20 means 20% copay)
  subCoverages?: { name: string; limit: number }[];
}

const userPolicies: UserPolicy[] = [
  {
    id: "p1",
    name: "Seguro Complementario de Salud",
    company: "MetLife",
    category: "SALUD",
    status: "ACTIVE",
    coverageLimit: 5000000,
    deductible: 200000,
    copayPercent: 20,
    subCoverages: [
      { name: "Consultas medicas", limit: 500000 },
      { name: "Hospitalizacion", limit: 3000000 },
      { name: "Cirugia", limit: 5000000 },
      { name: "Medicamentos", limit: 200000 },
      { name: "Urgencias", limit: 1000000 },
    ],
  },
  {
    id: "p2",
    name: "Seguro de Vida",
    company: "Consorcio Nacional",
    category: "VIDA",
    status: "ACTIVE",
    coverageLimit: 50000000,
    deductible: 0,
    copayPercent: 0,
  },
  {
    id: "p3",
    name: "Seguro Automotriz Todo Riesgo",
    company: "BCI Seguros",
    category: "VEHICULO",
    status: "ACTIVE",
    coverageLimit: 15000000,
    deductible: 110000, // ~3 UF
    copayPercent: 10,
  },
  {
    id: "p4",
    name: "SOAP Obligatorio",
    company: "Liberty Seguros",
    category: "VEHICULO",
    status: "ACTIVE",
    coverageLimit: 4000000, // covers medical expenses from auto accidents
    deductible: 0,
    copayPercent: 0,
  },
];

// ─── Health system config ────────────────────────────────────────────────────

type HealthSystem = "FONASA_A" | "FONASA_B" | "FONASA_C" | "FONASA_D" | "ISAPRE";

const healthSystemLabels: Record<HealthSystem, string> = {
  FONASA_A: "FONASA Tramo A (indigente)",
  FONASA_B: "FONASA Tramo B (< $400.000)",
  FONASA_C: "FONASA Tramo C ($400.000 - $600.000)",
  FONASA_D: "FONASA Tramo D (> $600.000)",
  ISAPRE: "ISAPRE",
};

// Coverage % in PRIVATE network (prestador privado) - which is the common case
const healthSystemCoverage: Record<HealthSystem, number> = {
  FONASA_A: 0,    // FONASA A: 100% publico, 0% privado libre eleccion
  FONASA_B: 50,   // FONASA B: 50% en libre eleccion
  FONASA_C: 60,   // FONASA C: 60% en libre eleccion (varies by MLE level)
  FONASA_D: 70,   // FONASA D: 70% en libre eleccion
  ISAPRE: 75,     // ISAPRE: depends on plan, avg ~70-80%
};

// ─── Event types ─────────────────────────────────────────────────────────────

const eventTypes = [
  { value: "cirugia", label: "Cirugia", icon: Heart, category: "SALUD" },
  { value: "hospitalizacion", label: "Hospitalizacion", icon: Heart, category: "SALUD" },
  { value: "consulta", label: "Consulta medica", icon: Heart, category: "SALUD" },
  { value: "urgencia", label: "Urgencia medica", icon: Heart, category: "SALUD" },
  { value: "medicamentos", label: "Medicamentos", icon: Heart, category: "SALUD" },
  { value: "accidente_auto", label: "Accidente vehicular", icon: Car, category: "VEHICULO" },
  { value: "robo_vehiculo", label: "Robo de vehiculo", icon: Car, category: "VEHICULO" },
  { value: "dano_propiedad", label: "Dano a propiedad/hogar", icon: Home, category: "HOGAR" },
  { value: "viaje", label: "Emergencia de viaje", icon: Plane, category: "VIAJE" },
];

// ─── Simulation Logic ────────────────────────────────────────────────────────

function simulate(
  eventType: string,
  amount: number,
  healthSystem: HealthSystem,
  isPublicNetwork: boolean,
  description: string = "",
  annualCopayAccumulated: number = 0,
): SimResult {
  const event = eventTypes.find((e) => e.value === eventType);
  if (!event) {
    return emptyResult(amount, "Tipo de evento no reconocido");
  }

  const category = event.category;

  // ═══════════════════════════════════════════════════════════════════════════
  //  HEALTH EVENTS: GES? → FONASA/ISAPRE → CAEC? → Complementario → Bolsillo
  // ═══════════════════════════════════════════════════════════════════════════
  if (category === "SALUD") {
    // Try to detect GES pathology from description
    const gesMatch = detectGESPathology(description);
    return simulateHealth(eventType, amount, healthSystem, isPublicNetwork, gesMatch, annualCopayAccumulated);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  VEHICLE EVENTS
  // ═══════════════════════════════════════════════════════════════════════════
  if (category === "VEHICULO") {
    return simulateVehicle(eventType, amount);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  OTHER EVENTS (HOGAR, VIAJE, etc.)
  // ═══════════════════════════════════════════════════════════════════════════
  return simulateGeneric(amount, category);
}

function simulateHealth(
  eventType: string,
  amount: number,
  healthSystem: HealthSystem,
  isPublicNetwork: boolean,
  gesPathology: GESPathology | null = null,
  annualCopayAccumulated: number = 0,
): SimResult {
  const steps: WaterfallStep[] = [];
  const warnings: string[] = [];
  let remaining = amount;

  const systemName = healthSystem.startsWith("FONASA") ? "FONASA" : "ISAPRE";

  // ══════════════════════════════════════════════════════════════════════════
  //  Step 0: GES/AUGE check — if pathology is GES, copay is capped by law
  // ══════════════════════════════════════════════════════════════════════════
  if (gesPathology) {
    const gesCopayPct = getGESCopayPercent(healthSystem as HealthSystemType);
    const gesCopay = Math.round(amount * (gesCopayPct / 100));
    const gesCoverage = amount - gesCopay;

    steps.push({
      label: "GES / AUGE (garantia estatal)",
      entity: `Patologia GES #${gesPathology.id}: ${gesPathology.name}`,
      amountIn: amount,
      covers: gesCoverage,
      remainder: gesCopay,
      deductible: 0,
      copayPercent: gesCopayPct,
      copayAmount: gesCopay,
      color: "#10b981",
      note: gesCopayPct === 0
        ? `${systemName} Tramo A/B: copago GES 0% — tratamiento garantizado gratuito`
        : `Copago GES regulado: ${gesCopayPct}% del arancel de referencia. Plazo maximo: ${gesPathology.maxWaitDays} dias`,
    });

    remaining = gesCopay;

    if (remaining <= 0) {
      return buildResult(amount, steps, warnings,
        `Esta patologia esta cubierta por GES/AUGE. Como beneficiario ${systemName} Tramo A/B, el copago GES es 0%. Tratamiento garantizado.`);
    }

    // ── CAEC check (only ISAPRE, only if copay is high) ──
    if (healthSystem === "ISAPRE") {
      const caecResult = calculateCAEC(healthSystem, annualCopayAccumulated, remaining);
      if (caecResult.applies) {
        steps.push({
          label: "CAEC (catastrofica ISAPRE)",
          entity: "Cobertura Adicional Enfermedades Catastroficas",
          amountIn: remaining,
          covers: caecResult.coveredByCAEC,
          remainder: remaining - caecResult.coveredByCAEC,
          deductible: 0,
          copayPercent: 0,
          copayAmount: 0,
          color: "#8b5cf6",
          note: caecResult.note,
        });
        remaining -= caecResult.coveredByCAEC;
      } else {
        warnings.push(
          `CAEC: ${caecResult.note}. Si tu copago anual acumulado supera $${fmtN(CAEC_DEDUCTIBLE_CLP)} (~126 UF), CAEC cubriria el 100% del exceso.`
        );
      }
    }

    // GES may still leave copay — complementario can cover it
    const complementario = userPolicies.find(
      (p) => p.category === "SALUD" && p.status === "ACTIVE"
    );

    if (complementario && remaining > 0) {
      const ded = Math.min(complementario.deductible, remaining);
      const afterDed = remaining - ded;
      const covers = Math.round(afterDed * ((100 - complementario.copayPercent) / 100));
      const copay = afterDed - covers;

      steps.push({
        label: "Seguro complementario (sobre copago GES)",
        entity: `${complementario.name} - ${complementario.company}`,
        amountIn: remaining,
        covers,
        remainder: ded + copay,
        deductible: ded,
        copayPercent: complementario.copayPercent,
        copayAmount: copay + ded,
        color: "#06b6d4",
        note: `Aplica sobre el copago GES residual de $${fmtN(remaining)}`,
      });
      remaining = ded + copay;
    }

    steps.push({
      label: "Gasto de bolsillo",
      entity: "Tu",
      amountIn: remaining,
      covers: 0,
      remainder: remaining,
      deductible: 0,
      copayPercent: 100,
      copayAmount: remaining,
      color: "#f59e0b",
    });

    warnings.push(
      "La cobertura GES aplica solo si el diagnostico esta confirmado y se activa la garantia con tu FONASA/ISAPRE."
    );
    warnings.push(
      `Plazo garantizado de tratamiento GES: ${gesPathology.maxWaitDays} dias desde la confirmacion diagnostica.`
    );

    return buildResult(amount, steps, warnings,
      `Esta patologia (${gesPathology.name}) esta cubierta por GES/AUGE con copago regulado del ${gesCopayPct}%. ${
        healthSystem === "ISAPRE" ? "Si el copago anual supera ~126 UF, se activa CAEC." : ""
      } El seguro complementario puede cubrir parte del copago restante.`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Route NO-GES: FONASA/ISAPRE → CAEC? → Complementario → Bolsillo
  // ══════════════════════════════════════════════════════════════════════════

  // ── Step 1: FONASA or ISAPRE bonification ──
  let primaryCoveragePercent: number;
  if (isPublicNetwork && healthSystem.startsWith("FONASA")) {
    const publicCoverage: Record<string, number> = {
      FONASA_A: 100, FONASA_B: 100, FONASA_C: 90, FONASA_D: 80,
    };
    primaryCoveragePercent = publicCoverage[healthSystem] ?? 80;
  } else {
    primaryCoveragePercent = healthSystemCoverage[healthSystem];
  }

  const primaryCovers = Math.round(amount * (primaryCoveragePercent / 100));
  const afterPrimary = amount - primaryCovers;

  const systemLabel = healthSystem.startsWith("FONASA")
    ? `FONASA (${healthSystem.split("_")[1]}) - ${isPublicNetwork ? "Red publica" : "Libre eleccion"}`
    : `ISAPRE - ${isPublicNetwork ? "Red preferente" : "Libre eleccion"}`;

  steps.push({
    label: "Cobertura primaria",
    entity: systemLabel,
    amountIn: amount,
    covers: primaryCovers,
    remainder: afterPrimary,
    deductible: 0,
    copayPercent: 100 - primaryCoveragePercent,
    copayAmount: afterPrimary,
    color: "#3b82f6",
    note: `Bonificacion del ${primaryCoveragePercent}% sobre el arancel`,
  });
  remaining = afterPrimary;

  if (remaining <= 0) {
    return buildResult(amount, steps, warnings,
      "Tu plan de salud cubre el 100% del gasto en la red publica.");
  }

  // ── Step 1.5: CAEC check for ISAPRE (high cost events) ──
  if (healthSystem === "ISAPRE") {
    const caecResult = calculateCAEC(healthSystem, annualCopayAccumulated, remaining);
    if (caecResult.applies) {
      steps.push({
        label: "CAEC (catastrofica ISAPRE)",
        entity: "Cobertura Adicional Enfermedades Catastroficas",
        amountIn: remaining,
        covers: caecResult.coveredByCAEC,
        remainder: remaining - caecResult.coveredByCAEC,
        deductible: 0,
        copayPercent: 0,
        copayAmount: 0,
        color: "#8b5cf6",
        note: caecResult.note,
      });
      remaining -= caecResult.coveredByCAEC;
    } else if (remaining > 2000000) {
      warnings.push(
        `CAEC no aplica aun: ${caecResult.note}`
      );
    }
  }

  // ── Step 2: Seguro Complementario ──
  const complementario = userPolicies.find(
    (p) => p.category === "SALUD" && p.status === "ACTIVE"
  );

  if (complementario && remaining > 0) {
    let applicableLimit = complementario.coverageLimit;
    if (complementario.subCoverages) {
      const subKey = eventType === "cirugia" ? "Cirugia"
        : eventType === "hospitalizacion" ? "Hospitalizacion"
        : eventType === "consulta" ? "Consultas medicas"
        : eventType === "urgencia" ? "Urgencias"
        : eventType === "medicamentos" ? "Medicamentos"
        : null;
      if (subKey) {
        const sub = complementario.subCoverages.find((s) => s.name === subKey);
        if (sub) applicableLimit = sub.limit;
      }
    }

    const deductible = Math.min(complementario.deductible, remaining);
    const afterDeductible = remaining - deductible;
    const coverableAmount = Math.min(afterDeductible, applicableLimit);
    const complementCovers = Math.round(coverableAmount * ((100 - complementario.copayPercent) / 100));
    const complementCopay = coverableAmount - complementCovers;

    steps.push({
      label: "Seguro complementario",
      entity: `${complementario.name} - ${complementario.company}`,
      amountIn: remaining,
      covers: complementCovers,
      remainder: Math.max(0, remaining - deductible - complementCovers),
      deductible: deductible,
      copayPercent: complementario.copayPercent,
      copayAmount: complementCopay + deductible,
      color: "#06b6d4",
      note: `Deducible: $${fmtN(deductible)} + Copago ${complementario.copayPercent}% (tope: $${fmtN(applicableLimit)})`,
    });

    remaining = Math.max(0, deductible + complementCopay + Math.max(0, afterDeductible - applicableLimit));

    warnings.push("El seguro complementario aplica DESPUES de la bonificacion de FONASA/ISAPRE, sobre el copago restante.");
    if (afterDeductible > applicableLimit) {
      warnings.push(`Tope de cobertura alcanzado: $${fmtN(applicableLimit)}. Exceso de $${fmtN(afterDeductible - applicableLimit)} es de tu bolsillo.`);
    }
  } else if (!complementario) {
    warnings.push("No tienes seguro complementario de salud cargado. Todo el copago despues de FONASA/ISAPRE es de tu bolsillo.");
  }

  // ── Step 3: Out of pocket ──
  steps.push({
    label: "Gasto de bolsillo",
    entity: "Tu",
    amountIn: remaining,
    covers: 0,
    remainder: remaining,
    deductible: 0,
    copayPercent: 100,
    copayAmount: remaining,
    color: "#f59e0b",
  });

  const explanation = complementario
    ? `Primero ${systemName} bonifica el ${primaryCoveragePercent}% ($${fmtN(primaryCovers)}). ${
        healthSystem === "ISAPRE" ? "Si el copago anual supera ~126 UF, CAEC cubre el exceso. " : ""
      }Luego tu seguro complementario ${complementario.company} cubre parte del copago restante.`
    : `${systemName} bonifica el ${primaryCoveragePercent}%. Sin seguro complementario, el copago restante es de tu bolsillo.`;

  return buildResult(amount, steps, warnings, explanation);
}

function simulateVehicle(eventType: string, amount: number): SimResult {
  const steps: WaterfallStep[] = [];
  const warnings: string[] = [];

  // SOAP covers medical expenses from car accidents (for people, not the car)
  const soap = userPolicies.find(
    (p) => p.name.includes("SOAP") && p.status === "ACTIVE"
  );

  const autoPolicy = userPolicies.find(
    (p) => p.category === "VEHICULO" && !p.name.includes("SOAP") && p.status === "ACTIVE"
  );

  let remaining = amount;

  if (eventType === "accidente_auto" && soap) {
    // SOAP covers medical/hospitalization from car accidents first
    const soapCovers = Math.min(soap.coverageLimit, Math.round(amount * 0.3)); // ~30% is medical
    steps.push({
      label: "SOAP (gastos medicos)",
      entity: `${soap.name} - ${soap.company}`,
      amountIn: amount,
      covers: soapCovers,
      remainder: amount - soapCovers,
      deductible: 0,
      copayPercent: 0,
      copayAmount: 0,
      color: "#10b981",
      note: "SOAP cubre gastos medicos por accidentes de transito",
    });
    remaining -= soapCovers;
  }

  if (autoPolicy) {
    const deductible = Math.min(autoPolicy.deductible, remaining);
    const afterDed = remaining - deductible;
    const covers = Math.round(afterDed * ((100 - autoPolicy.copayPercent) / 100));
    const copay = afterDed - covers;

    steps.push({
      label: eventType === "robo_vehiculo" ? "Seguro contra robo" : "Seguro automotriz",
      entity: `${autoPolicy.name} - ${autoPolicy.company}`,
      amountIn: remaining,
      covers: Math.min(covers, autoPolicy.coverageLimit),
      remainder: deductible + copay,
      deductible,
      copayPercent: autoPolicy.copayPercent,
      copayAmount: copay,
      color: "#3b82f6",
      note: `Deducible: $${fmtN(deductible)} (~3 UF) + Copago ${autoPolicy.copayPercent}%`,
    });
    remaining = deductible + copay;
  } else {
    warnings.push("No tienes seguro automotriz cargado.");
  }

  steps.push({
    label: "Gasto de bolsillo",
    entity: "Tu",
    amountIn: remaining,
    covers: 0,
    remainder: remaining,
    deductible: 0,
    copayPercent: 100,
    copayAmount: remaining,
    color: "#f59e0b",
  });

  return buildResult(amount, steps, warnings,
    eventType === "accidente_auto"
      ? "En accidentes vehiculares, primero aplica el SOAP para gastos medicos. Luego el seguro automotriz cubre danos al vehiculo."
      : "El seguro automotriz aplica directamente con su deducible y copago."
  );
}

function simulateGeneric(amount: number, category: string): SimResult {
  const policy = userPolicies.find(
    (p) => p.category === category && p.status === "ACTIVE"
  );
  const steps: WaterfallStep[] = [];
  const warnings: string[] = [];

  if (!policy) {
    warnings.push(`No tienes polizas activas en la categoria ${category}.`);
    steps.push({
      label: "Gasto de bolsillo", entity: "Tu", amountIn: amount,
      covers: 0, remainder: amount, deductible: 0,
      copayPercent: 100, copayAmount: amount, color: "#ef4444",
    });
    return buildResult(amount, steps, warnings, "Sin cobertura para este tipo de evento.");
  }

  const ded = Math.min(policy.deductible, amount);
  const afterDed = amount - ded;
  const covers = Math.round(afterDed * ((100 - policy.copayPercent) / 100));
  steps.push({
    label: "Seguro", entity: `${policy.name} - ${policy.company}`,
    amountIn: amount, covers, remainder: ded + (afterDed - covers),
    deductible: ded, copayPercent: policy.copayPercent,
    copayAmount: afterDed - covers, color: "#3b82f6",
  });
  steps.push({
    label: "Gasto de bolsillo", entity: "Tu",
    amountIn: ded + (afterDed - covers), covers: 0,
    remainder: ded + (afterDed - covers), deductible: 0,
    copayPercent: 100, copayAmount: ded + (afterDed - covers), color: "#f59e0b",
  });

  return buildResult(amount, steps, warnings, "Cobertura directa segun tu poliza.");
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildResult(amount: number, steps: WaterfallStep[], warnings: string[], explanation: string): SimResult {
  const totalCovered = steps
    .filter((s) => s.label !== "Gasto de bolsillo")
    .reduce((sum, s) => sum + s.covers, 0);
  const oop = amount - totalCovered;

  return {
    eventAmount: amount,
    steps,
    totalCovered,
    totalOutOfPocket: Math.max(0, oop),
    coveragePercent: Math.round((totalCovered / amount) * 100),
    confidence: warnings.length === 0 ? "Alta" : warnings.length <= 2 ? "Media" : "Baja",
    warnings: [
      ...warnings,
      "Esta simulacion es hipotetica. Los montos reales dependen de las condiciones especificas de cada poliza, aranceles y prestador.",
      "No constituye compromiso de cobertura por parte de ninguna aseguradora.",
    ],
    explanation,
  };
}

function emptyResult(amount: number, msg: string): SimResult {
  return {
    eventAmount: amount, steps: [], totalCovered: 0,
    totalOutOfPocket: amount, coveragePercent: 0, confidence: "Baja",
    warnings: [msg], explanation: msg,
  };
}

function fmtN(n: number): string {
  return n.toLocaleString("es-CL");
}

function fmtCLP(n: number): string {
  return `$${n.toLocaleString("es-CL")}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function SimulatePage() {
  // Form state
  const [eventType, setEventType] = useState("cirugia");
  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("4.500.000");
  const [healthSystem, setHealthSystem] = useState<HealthSystem>("ISAPRE");
  const [isPublicNetwork, setIsPublicNetwork] = useState(false);
  const [annualCopayStr, setAnnualCopayStr] = useState("0");

  // GES detection (live as user types)
  const detectedGES = detectGESPathology(description);

  // Result state
  const [result, setResult] = useState<SimResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentEvent = eventTypes.find((e) => e.value === eventType);
  const isHealthEvent = currentEvent?.category === "SALUD";

  const parseAmount = (s: string) => parseInt(s.replace(/\./g, "").replace(/\$/g, ""), 10) || 0;

  const formatAmountInput = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, "");
    if (!digits) return "";
    return parseInt(digits, 10).toLocaleString("es-CL");
  };

  const handleSimulate = () => {
    const errs: Record<string, string> = {};
    const amount = parseAmount(amountStr);
    if (!description.trim()) errs.description = "Describe el evento";
    if (amount <= 0) errs.amount = "Ingresa un monto valido";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});

    setIsLoading(true);
    setResult(null);
    const annualCopay = parseInt(annualCopayStr.replace(/\./g, ""), 10) || 0;
    setTimeout(() => {
      const r = simulate(eventType, amount, healthSystem, isPublicNetwork, description, annualCopay);
      setResult(r);
      setIsLoading(false);
    }, 1500);
  };

  const reset = () => { setResult(null); setAmountStr(""); setDescription(""); };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-500">
          <Calculator className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#e2e8f0]">Simulador de Escenarios</h1>
          <p className="text-sm text-[#94a3b8]">
            Simula un evento y ve como responden tus seguros segun el orden real de cobertura
          </p>
        </div>
      </div>

      {/* Info banner: how Chilean health insurance works */}
      {isHealthEvent && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex gap-3">
          <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm text-[#94a3b8]">
            <p className="font-medium text-blue-400 mb-1">Orden de cobertura en salud en Chile</p>
            <p>
              <strong className="text-emerald-400">0.</strong> Si es patologia GES/AUGE (87 enfermedades), el copago esta regulado por ley (0-20%).{" "}
              <strong className="text-[#e2e8f0]">1.</strong> FONASA o ISAPRE bonifica segun tu plan y red.{" "}
              <strong className="text-purple-400">1.5</strong> CAEC (solo ISAPRE): si el copago anual supera ~126 UF, cubre el 100% del exceso.{" "}
              <strong className="text-cyan-400">2.</strong> Seguro complementario sobre el copago restante.{" "}
              <strong className="text-amber-400">3.</strong> Tu bolsillo.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ─── LEFT: FORM (2/5) ─── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-5 space-y-4">
            <h2 className="text-base font-semibold text-[#e2e8f0]">Datos del evento</h2>

            {/* Event type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#e2e8f0]">Tipo de evento</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full rounded-xl border border-[#2d3548] bg-[#0f1117] px-4 py-3 text-sm text-[#e2e8f0] appearance-none focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
              >
                {eventTypes.map((et) => (
                  <option key={et.value} value={et.value} className="bg-[#0f1117]">
                    {et.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Health system selector (only for health events) */}
            {isHealthEvent && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#e2e8f0]">Tu sistema de salud</label>
                  <select
                    value={healthSystem}
                    onChange={(e) => setHealthSystem(e.target.value as HealthSystem)}
                    className="w-full rounded-xl border border-[#2d3548] bg-[#0f1117] px-4 py-3 text-sm text-[#e2e8f0] appearance-none focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  >
                    {(Object.keys(healthSystemLabels) as HealthSystem[]).map((k) => (
                      <option key={k} value={k} className="bg-[#0f1117]">
                        {healthSystemLabels[k]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPublicNetwork(!isPublicNetwork)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                      isPublicNetwork ? "bg-blue-600" : "bg-[#2d3548]"
                    }`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      isPublicNetwork ? "left-[22px]" : "left-0.5"
                    }`} />
                  </button>
                  <span className="text-sm text-[#94a3b8]">
                    {isPublicNetwork ? "Red publica / preferente" : "Libre eleccion / privado"}
                  </span>
                </div>
              </>
            )}

            {/* Annual copay accumulated (for CAEC) */}
            {isHealthEvent && healthSystem === "ISAPRE" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#e2e8f0]">Copago acumulado este ano (CLP)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#94a3b8]">$</span>
                  <input
                    type="text"
                    value={annualCopayStr}
                    onChange={(e) => setAnnualCopayStr(formatAmountInput(e.target.value))}
                    placeholder="0"
                    className="w-full rounded-xl border border-[#2d3548] bg-[#0f1117] pl-8 pr-4 py-3 text-sm text-[#e2e8f0] focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
                <p className="text-xs text-[#64748b]">Si tu copago anual supera ~$4.700.000 (126 UF), se activa CAEC</p>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#e2e8f0]">Descripcion del evento</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Cirugia artroscopia de rodilla en Clinica Alemana"
                rows={3}
                className={`w-full rounded-xl border bg-[#0f1117] px-4 py-3 text-sm text-[#e2e8f0] placeholder:text-[#64748b] resize-none focus:outline-none focus:ring-1 transition-colors ${
                  errors.description ? "border-red-500 focus:ring-red-500/50" : "border-[#2d3548] focus:border-purple-500/50 focus:ring-purple-500/50"
                }`}
              />
              {errors.description && <p className="text-xs text-red-400">{errors.description}</p>}

              {/* Live GES detection */}
              {isHealthEvent && detectedGES && (
                <div className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 mt-2">
                  <Sparkles className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-400">
                      Patologia GES detectada: {detectedGES.name}
                    </p>
                    <p className="text-xs text-[#94a3b8] mt-0.5">
                      Categoria: {detectedGES.category} — Copago GES: {getGESCopayPercent(healthSystem as HealthSystemType)}%
                      {detectedGES.maxWaitDays > 0 && ` — Plazo garantizado: ${detectedGES.maxWaitDays} dias`}
                    </p>
                    <p className="text-xs text-[#64748b] mt-0.5">
                      Costo tipico: ${detectedGES.typicalCostMin.toLocaleString("es-CL")} - ${detectedGES.typicalCostMax.toLocaleString("es-CL")} CLP
                    </p>
                  </div>
                </div>
              )}
              {isHealthEvent && description.length > 5 && !detectedGES && (
                <p className="text-xs text-[#64748b] mt-1 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  No se detecto patologia GES. Se simulara con cobertura regular.
                </p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#e2e8f0]">Monto estimado (CLP)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#94a3b8]">$</span>
                <input
                  type="text"
                  value={amountStr}
                  onChange={(e) => setAmountStr(formatAmountInput(e.target.value))}
                  placeholder="4.500.000"
                  className={`w-full rounded-xl border bg-[#0f1117] pl-8 pr-16 py-3 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:outline-none focus:ring-1 transition-colors ${
                    errors.amount ? "border-red-500 focus:ring-red-500/50" : "border-[#2d3548] focus:border-purple-500/50 focus:ring-purple-500/50"
                  }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#64748b]">CLP</span>
              </div>
              {errors.amount && <p className="text-xs text-red-400">{errors.amount}</p>}
            </div>

            {/* Simulate button */}
            <button
              onClick={handleSimulate}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 py-3.5 text-sm font-semibold text-white transition-all hover:from-purple-500 hover:to-pink-400 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
              {isLoading ? "Simulando..." : "Simular Escenario"}
            </button>

            {result && (
              <button onClick={reset} className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#2d3548] py-2.5 text-sm text-[#94a3b8] hover:text-[#e2e8f0] hover:border-[#3d4a63] transition-colors">
                <RotateCcw className="h-4 w-4" /> Nueva simulacion
              </button>
            )}
          </div>

          {/* Policies used */}
          <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-5">
            <h3 className="text-sm font-semibold text-[#e2e8f0] mb-3">Tus polizas consideradas</h3>
            <div className="space-y-2">
              {userPolicies.map((p) => (
                <div key={p.id} className="flex items-center gap-2 text-xs text-[#94a3b8]">
                  <div className={`h-2 w-2 rounded-full ${p.status === "ACTIVE" ? "bg-emerald-400" : "bg-[#64748b]"}`} />
                  <span className="text-[#e2e8f0]">{p.company}</span>
                  <span>- {p.name}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-[#64748b]">
              Agrega mas polizas en &quot;Mis Seguros&quot; para una simulacion mas completa.
            </p>
          </div>
        </div>

        {/* ─── RIGHT: RESULTS (3/5) ─── */}
        <div className="lg:col-span-3">
          {!result && !isLoading && (
            <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-12 text-center">
              <Calculator className="h-12 w-12 text-[#2d3548] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#e2e8f0] mb-2">Configura tu escenario</h3>
              <p className="text-sm text-[#94a3b8] max-w-sm mx-auto">
                Selecciona un tipo de evento, ingresa el monto y presiona &quot;Simular&quot; para ver como responden tus seguros.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-12 text-center">
              <Loader2 className="h-10 w-10 text-purple-400 mx-auto mb-4 animate-spin" />
              <p className="text-sm text-[#94a3b8]">Calculando cobertura segun el orden real...</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-[#e2e8f0]">Resultado de la simulacion</h2>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border ${
                    result.confidence === "Alta" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                    result.confidence === "Media" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                    "bg-red-500/10 border-red-500/20 text-red-400"
                  }`}>
                    {result.confidence === "Alta" ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    Confianza {result.confidence.toLowerCase()}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="rounded-xl bg-[#0f1117] p-4 text-center">
                    <p className="text-xs text-[#94a3b8] mb-1">Costo del evento</p>
                    <p className="text-xl font-bold text-[#e2e8f0]">{fmtCLP(result.eventAmount)}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-4 text-center">
                    <p className="text-xs text-emerald-400 mb-1">Cobertura total</p>
                    <p className="text-xl font-bold text-emerald-400">{fmtCLP(result.totalCovered)}</p>
                    <p className="text-xs text-emerald-400/60">{result.coveragePercent}%</p>
                  </div>
                  <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-4 text-center">
                    <p className="text-xs text-amber-400 mb-1">Tu bolsillo</p>
                    <p className="text-xl font-bold text-amber-400">{fmtCLP(result.totalOutOfPocket)}</p>
                    <p className="text-xs text-amber-400/60">{100 - result.coveragePercent}%</p>
                  </div>
                </div>

                {/* Coverage bar */}
                <div className="h-4 w-full rounded-full bg-[#0f1117] overflow-hidden flex">
                  {result.steps.filter(s => s.label !== "Gasto de bolsillo").map((s, i) => {
                    const pct = (s.covers / result.eventAmount) * 100;
                    return (
                      <div key={i} className="h-full transition-all duration-1000"
                        style={{ width: `${pct}%`, backgroundColor: s.color }}
                        title={`${s.entity}: ${fmtCLP(s.covers)}`}
                      />
                    );
                  })}
                  <div className="h-full bg-amber-500/40 flex-1" title={`Bolsillo: ${fmtCLP(result.totalOutOfPocket)}`} />
                </div>
                <div className="flex flex-wrap gap-3 mt-2">
                  {result.steps.filter(s => s.label !== "Gasto de bolsillo").map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.entity.split(" - ")[0]}
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500/40" />Tu bolsillo
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                <p className="text-sm text-[#94a3b8]">
                  <span className="font-medium text-blue-400">Explicacion:</span> {result.explanation}
                </p>
              </div>

              {/* Waterfall: step by step */}
              <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-5">
                <h3 className="text-base font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-purple-400" />
                  Cascada de cobertura (paso a paso)
                </h3>
                <div className="space-y-1">
                  {result.steps.map((step, i) => (
                    <div key={i}>
                      {i > 0 && (
                        <div className="flex justify-center py-1">
                          <ArrowDown className="h-4 w-4 text-[#2d3548]" />
                        </div>
                      )}
                      <div className={`rounded-xl border p-4 ${
                        step.label === "Gasto de bolsillo"
                          ? "border-amber-500/20 bg-amber-500/5"
                          : "border-[#2d3548] bg-[#0f1117]"
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: step.color }} />
                            <span className="text-sm font-semibold text-[#e2e8f0]">{step.label}</span>
                          </div>
                          {step.covers > 0 && (
                            <span className="text-sm font-bold text-emerald-400">
                              -{fmtCLP(step.covers)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#94a3b8] mb-1">{step.entity}</p>
                        {step.note && (
                          <p className="text-xs text-[#64748b] italic">{step.note}</p>
                        )}
                        {step.label !== "Gasto de bolsillo" && (
                          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#2d3548]/50">
                            <div>
                              <p className="text-[10px] text-[#64748b] uppercase">Entra</p>
                              <p className="text-xs font-medium text-[#e2e8f0]">{fmtCLP(step.amountIn)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-[#64748b] uppercase">Cubre</p>
                              <p className="text-xs font-medium text-emerald-400">{fmtCLP(step.covers)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-[#64748b] uppercase">Sale</p>
                              <p className="text-xs font-medium text-amber-400">{fmtCLP(step.remainder)}</p>
                            </div>
                          </div>
                        )}
                        {step.label === "Gasto de bolsillo" && (
                          <p className="text-lg font-bold text-amber-400 mt-1">{fmtCLP(step.copayAmount)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warnings */}
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4" /> Advertencias
                </h3>
                <ul className="space-y-2">
                  {result.warnings.map((w, i) => (
                    <li key={i} className="text-xs text-[#94a3b8] flex gap-2">
                      <span className="text-amber-500 shrink-0">•</span>{w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
