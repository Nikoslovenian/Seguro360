"use client";

import { useState, useEffect } from "react";
import {
  Eye,
  AlertTriangle,
  ShieldOff,
  Clock,
  BarChart3,
  Settings2,
  FileText,
  ChevronRight,
  AlertOctagon,
  ShieldAlert,
  TrendingUp,
  Timer,
  Gauge,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ClauseCategory = "exclusion" | "carencia" | "tope" | "ajuste";
type ClauseSeverity = "critica" | "alta" | "media" | "baja";
type ClauseImpact = "alto" | "medio" | "bajo";

interface DetectedClause {
  id: string;
  category: ClauseCategory;
  severity: ClauseSeverity;
  policy: string;
  company: string;
  text: string;
  pageRef?: string;
  sectionRef?: string;
  confidence: number; // 0-100
  impact: ClauseImpact;
  // For carencias
  carenciaStart?: string;
  carenciaEnd?: string;
  carenciaCumplida?: boolean;
  // For topes
  usagePercent?: number;
  topeAmount?: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockClauses: DetectedClause[] = [
  // EXCLUSIONES CRITICAS
  {
    id: "exc-1",
    category: "exclusion",
    severity: "critica",
    policy: "Seguro Complementario Salud",
    company: "MetLife",
    text: "Excluye enfermedades preexistentes no declaradas",
    pageRef: "Pagina 8",
    sectionRef: "Seccion 4.1 - Exclusiones generales",
    confidence: 95,
    impact: "alto",
  },
  {
    id: "exc-2",
    category: "exclusion",
    severity: "critica",
    policy: "Seguro Complementario Salud",
    company: "MetLife",
    text: "Excluye tratamientos de fertilidad y reproduccion asistida",
    pageRef: "Pagina 12",
    sectionRef: "Seccion 4.3 - Exclusiones especificas",
    confidence: 92,
    impact: "medio",
  },
  {
    id: "exc-3",
    category: "exclusion",
    severity: "critica",
    policy: "Seguro Complementario Salud",
    company: "MetLife",
    text: "Excluye cirugia estetica sin indicacion medica",
    pageRef: "Pagina 12",
    sectionRef: "Seccion 4.3 - Exclusiones especificas",
    confidence: 98,
    impact: "bajo",
  },
  {
    id: "exc-4",
    category: "exclusion",
    severity: "critica",
    policy: "Seguro Automotriz",
    company: "BCI",
    text: "Excluye conduccion bajo influencia de alcohol o drogas",
    pageRef: "Pagina 5",
    sectionRef: "Seccion 3.1 - Exclusiones del conductor",
    confidence: 99,
    impact: "alto",
  },
  {
    id: "exc-5",
    category: "exclusion",
    severity: "critica",
    policy: "Seguro Automotriz",
    company: "BCI",
    text: "Excluye danos por uso en competencias o carreras",
    pageRef: "Pagina 6",
    sectionRef: "Seccion 3.2 - Exclusiones de uso",
    confidence: 97,
    impact: "bajo",
  },
  {
    id: "exc-6",
    category: "exclusion",
    severity: "critica",
    policy: "Seguro de Vida",
    company: "Consorcio",
    text: "Excluye suicidio en los primeros 2 anos de vigencia",
    pageRef: "Pagina 3",
    sectionRef: "Seccion 2.1 - Periodo de carencia vital",
    confidence: 99,
    impact: "alto",
  },

  // CARENCIAS ACTIVAS
  {
    id: "car-1",
    category: "carencia",
    severity: "alta",
    policy: "Seguro Complementario Salud",
    company: "MetLife",
    text: "Carencia de 6 meses para cirugias electivas",
    pageRef: "Pagina 9",
    sectionRef: "Seccion 5.1 - Periodos de espera",
    confidence: 96,
    impact: "alto",
    carenciaStart: "01/01/2026",
    carenciaEnd: "01/07/2026",
    carenciaCumplida: false,
  },
  {
    id: "car-2",
    category: "carencia",
    severity: "media",
    policy: "Seguro Complementario Salud",
    company: "MetLife",
    text: "Carencia de 3 meses para consultas de especialidad",
    pageRef: "Pagina 9",
    sectionRef: "Seccion 5.2 - Periodos de espera ambulatorios",
    confidence: 94,
    impact: "medio",
    carenciaStart: "01/01/2026",
    carenciaEnd: "01/04/2026",
    carenciaCumplida: true,
  },

  // TOPES Y LIMITES
  {
    id: "top-1",
    category: "tope",
    severity: "media",
    policy: "Seguro Complementario Salud",
    company: "MetLife",
    text: "Tope anual de $5.000.000 para hospitalizacion",
    pageRef: "Pagina 6",
    sectionRef: "Seccion 3.1 - Limites de cobertura",
    confidence: 98,
    impact: "alto",
    usagePercent: 0,
    topeAmount: "$5.000.000",
  },
  {
    id: "top-2",
    category: "tope",
    severity: "alta",
    policy: "Seguro Complementario Salud",
    company: "MetLife",
    text: "Tope de $200.000/ano en medicamentos",
    pageRef: "Pagina 7",
    sectionRef: "Seccion 3.2 - Subtopes",
    confidence: 95,
    impact: "medio",
    usagePercent: 40,
    topeAmount: "$200.000",
  },
  {
    id: "top-3",
    category: "tope",
    severity: "media",
    policy: "Seguro Complementario Salud",
    company: "MetLife",
    text: "Maximo 30 dias de hospitalizacion por evento",
    pageRef: "Pagina 6",
    sectionRef: "Seccion 3.1 - Limites de cobertura",
    confidence: 93,
    impact: "medio",
  },
  {
    id: "top-4",
    category: "tope",
    severity: "media",
    policy: "Seguro Automotriz",
    company: "BCI",
    text: "Deducible de 3 UF por cada siniestro",
    pageRef: "Pagina 4",
    sectionRef: "Seccion 2.3 - Deducibles",
    confidence: 99,
    impact: "medio",
  },

  // CLAUSULAS DE AJUSTE
  {
    id: "adj-1",
    category: "ajuste",
    severity: "media",
    policy: "Seguro Complementario Salud",
    company: "MetLife",
    text: "Prima puede ajustarse anualmente segun siniestralidad del grupo",
    pageRef: "Pagina 14",
    sectionRef: "Seccion 7.1 - Ajuste de primas",
    confidence: 91,
    impact: "alto",
  },
  {
    id: "adj-2",
    category: "ajuste",
    severity: "alta",
    policy: "Seguro Complementario Salud",
    company: "MetLife",
    text: "Edad maxima de renovacion: 65 anos",
    pageRef: "Pagina 15",
    sectionRef: "Seccion 7.3 - Condiciones de renovacion",
    confidence: 97,
    impact: "alto",
  },
  {
    id: "adj-3",
    category: "ajuste",
    severity: "media",
    policy: "Seguro de Vida",
    company: "Consorcio",
    text: "Prima fija hasta los 60, luego reajuste por tabla de edad",
    pageRef: "Pagina 11",
    sectionRef: "Seccion 6.2 - Estructura de primas",
    confidence: 94,
    impact: "medio",
  },
  {
    id: "adj-4",
    category: "ajuste",
    severity: "alta",
    policy: "Seguro Automotriz",
    company: "BCI",
    text: "Deducible aumenta a 5 UF desde el 3er siniestro anual",
    pageRef: "Pagina 4",
    sectionRef: "Seccion 2.4 - Escalamiento de deducibles",
    confidence: 96,
    impact: "alto",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCategoryConfig(category: ClauseCategory) {
  switch (category) {
    case "exclusion":
      return {
        label: "Exclusiones Criticas",
        shortLabel: "Exclusiones",
        color: "red",
        icon: <ShieldOff className="w-5 h-5" />,
        bgClass: "bg-red-500/15 text-red-400 border-red-500/30",
        dotClass: "bg-red-500",
        headerBg: "bg-red-500/10 border-red-500/20",
      };
    case "carencia":
      return {
        label: "Carencias Activas",
        shortLabel: "Carencias",
        color: "amber",
        icon: <Timer className="w-5 h-5" />,
        bgClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        dotClass: "bg-amber-500",
        headerBg: "bg-amber-500/10 border-amber-500/20",
      };
    case "tope":
      return {
        label: "Topes y Limites",
        shortLabel: "Topes",
        color: "blue",
        icon: <BarChart3 className="w-5 h-5" />,
        bgClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        dotClass: "bg-blue-500",
        headerBg: "bg-blue-500/10 border-blue-500/20",
      };
    case "ajuste":
      return {
        label: "Clausulas de Ajuste",
        shortLabel: "Ajustes",
        color: "purple",
        icon: <Settings2 className="w-5 h-5" />,
        bgClass: "bg-purple-500/15 text-purple-400 border-purple-500/30",
        dotClass: "bg-purple-500",
        headerBg: "bg-purple-500/10 border-purple-500/20",
      };
  }
}

function getImpactBadge(impact: ClauseImpact) {
  switch (impact) {
    case "alto":
      return "bg-red-500/15 text-red-400 border border-red-500/30";
    case "medio":
      return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
    case "bajo":
      return "bg-green-500/15 text-green-400 border border-green-500/30";
  }
}

function getImpactLabel(impact: ClauseImpact) {
  switch (impact) {
    case "alto":
      return "Impacto Alto";
    case "medio":
      return "Impacto Medio";
    case "bajo":
      return "Impacto Bajo";
  }
}

function getUsageBarColor(percent: number): string {
  if (percent >= 75) return "bg-red-500";
  if (percent >= 50) return "bg-amber-500";
  return "bg-emerald-500";
}

function getConfidenceBadge(confidence: number) {
  if (confidence >= 95)
    return {
      label: `${confidence}% confianza`,
      className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    };
  if (confidence >= 85)
    return {
      label: `${confidence}% confianza`,
      className: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    };
  return {
    label: `${confidence}% confianza`,
    className: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  };
}

// ─── Risk Gauge (simplified) ─────────────────────────────────────────────────

function RiskGauge({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 300);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = 70;
  const strokeWidth = 10;
  const center = 85;
  const circumference = 2 * Math.PI * radius;
  const startAngle = 135;
  const totalArc = 270;
  const arcLength = (totalArc / 360) * circumference;
  const filledLength = (animated / 100) * arcLength;

  const color =
    score >= 70
      ? "#ef4444"
      : score >= 45
        ? "#f59e0b"
        : score >= 20
          ? "#3b82f6"
          : "#22c55e";

  const label =
    score >= 70
      ? "Riesgo Alto"
      : score >= 45
        ? "Riesgo Medio"
        : score >= 20
          ? "Riesgo Bajo"
          : "Riesgo Minimo";

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="170" height="170" viewBox="0 0 170 170">
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#2d3548"
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
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${filledLength} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform={`rotate(${startAngle} ${center} ${center})`}
            style={{
              transition: "stroke-dasharray 1s ease-out, stroke 0.5s ease",
              filter: `drop-shadow(0 0 6px ${color}80)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-3xl font-bold transition-colors duration-500"
            style={{ color }}
          >
            {animated}
          </span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">
            /100
          </span>
        </div>
      </div>
      <p className="text-sm font-semibold mt-1" style={{ color }}>
        {label}
      </p>
      <p className="text-[11px] text-slate-500 mt-0.5">
        Nivel de riesgo de letra chica
      </p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function FinePrintPage() {
  const [filter, setFilter] = useState<"all" | ClauseCategory>("all");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  // ── Computed stats ──
  const exclusionCount = mockClauses.filter(
    (c) => c.category === "exclusion",
  ).length;
  const carenciaActiveCount = mockClauses.filter(
    (c) => c.category === "carencia" && !c.carenciaCumplida,
  ).length;
  const topesRisk = mockClauses.filter(
    (c) => c.category === "tope" && c.usagePercent !== undefined && c.usagePercent >= 30,
  ).length;
  const totalClauses = mockClauses.length;

  // Risk score: weighted by severity and impact
  const riskScore = Math.min(
    100,
    Math.round(
      (exclusionCount * 8 + carenciaActiveCount * 10 + topesRisk * 6 + mockClauses.filter((c) => c.impact === "alto").length * 4) * 1.2,
    ),
  );

  // ── Filtered clauses ──
  const filteredClauses =
    filter === "all"
      ? mockClauses
      : mockClauses.filter((c) => c.category === filter);

  // Group by category for display
  const categories: ClauseCategory[] = [
    "exclusion",
    "carencia",
    "tope",
    "ajuste",
  ];
  const groupedClauses = categories
    .map((cat) => ({
      category: cat,
      config: getCategoryConfig(cat),
      clauses: filteredClauses.filter((c) => c.category === cat),
    }))
    .filter((g) => g.clauses.length > 0);

  return (
    <div
      className={`space-y-6 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30">
          <Eye className="w-7 h-7 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            Verificador de Letra Chica
          </h1>
          <p className="text-sm text-slate-400">
            Clausulas criticas detectadas en tus polizas
          </p>
        </div>
      </div>

      {/* ── Summary Panel ── */}
      <div className="bg-[#1c2333] border border-[#2d3548] rounded-xl p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
          {/* Stats */}
          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 rounded-lg bg-slate-500/20">
                  <FileText className="w-5 h-5 text-slate-300" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{totalClauses}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Clausulas detectadas
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <ShieldOff className="w-5 h-5 text-red-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-red-400">
                {exclusionCount}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Exclusiones criticas
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Timer className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-400">
                {carenciaActiveCount}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Carencias activas
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-400">{topesRisk}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Topes en riesgo
              </p>
            </div>
          </div>

          {/* Risk Gauge */}
          <div className="lg:col-span-2 flex justify-center">
            <RiskGauge score={riskScore} />
          </div>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex gap-1 bg-[#1c2333] border border-[#2d3548] rounded-xl p-1 overflow-x-auto">
        {(
          [
            { key: "all" as const, label: "Todas", count: totalClauses },
            {
              key: "exclusion" as const,
              label: "Exclusiones",
              count: mockClauses.filter((c) => c.category === "exclusion")
                .length,
            },
            {
              key: "carencia" as const,
              label: "Carencias",
              count: mockClauses.filter((c) => c.category === "carencia")
                .length,
            },
            {
              key: "tope" as const,
              label: "Topes",
              count: mockClauses.filter((c) => c.category === "tope").length,
            },
            {
              key: "ajuste" as const,
              label: "Ajustes",
              count: mockClauses.filter((c) => c.category === "ajuste").length,
            },
          ] as const
        ).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              filter === key
                ? "bg-white/10 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            {label}
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                filter === key
                  ? "bg-white/15 text-white"
                  : "bg-slate-700 text-slate-400"
              }`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Clause Groups ── */}
      <div className="space-y-6">
        {groupedClauses.map((group) => (
          <div key={group.category}>
            {/* Group header */}
            <div
              className={`flex items-center gap-3 mb-3 px-4 py-2.5 rounded-xl border ${group.config.headerBg}`}
            >
              <div className={group.config.bgClass + " p-1.5 rounded-lg border"}>
                {group.config.icon}
              </div>
              <h2
                className={`text-base font-bold ${
                  group.config.color === "red"
                    ? "text-red-400"
                    : group.config.color === "amber"
                      ? "text-amber-400"
                      : group.config.color === "blue"
                        ? "text-blue-400"
                        : "text-purple-400"
                }`}
              >
                {group.config.label}
              </h2>
              <span className="text-xs text-slate-500">
                ({group.clauses.length}{" "}
                {group.clauses.length === 1 ? "clausula" : "clausulas"})
              </span>
            </div>

            {/* Clause cards */}
            <div className="space-y-2">
              {group.clauses.map((clause, idx) => {
                const confidenceBadge = getConfidenceBadge(clause.confidence);
                return (
                  <div
                    key={clause.id}
                    className="bg-[#1c2333] border border-[#2d3548] rounded-xl overflow-hidden hover:border-slate-500/50 transition-all duration-200"
                    style={{
                      animation: loaded
                        ? `fadeSlideIn 0.35s ease-out ${idx * 50}ms both`
                        : "none",
                    }}
                  >
                    <div className="p-4">
                      {/* Top row: icon + policy info + badges */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-start gap-3">
                          {/* Severity dot + icon */}
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${group.config.dotClass}`}
                            />
                            <div
                              className={`p-1.5 rounded-lg border ${group.config.bgClass}`}
                            >
                              {group.config.icon}
                            </div>
                          </div>

                          <div className="min-w-0">
                            {/* Policy + company */}
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-xs font-semibold text-slate-300">
                                {clause.company}
                              </span>
                              <span className="text-[10px] text-slate-600">
                                |
                              </span>
                              <span className="text-xs text-slate-500">
                                {clause.policy}
                              </span>
                            </div>

                            {/* Clause text */}
                            <p className="text-sm text-white font-medium leading-relaxed">
                              {clause.text}
                            </p>

                            {/* Page / section reference */}
                            {(clause.pageRef || clause.sectionRef) && (
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                {clause.pageRef && (
                                  <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                                    {clause.pageRef}
                                  </span>
                                )}
                                {clause.sectionRef && (
                                  <span className="text-[10px] text-slate-600">
                                    {clause.sectionRef}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Carencia info */}
                            {clause.category === "carencia" && (
                              <div className="mt-2">
                                {clause.carenciaCumplida ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Cumplida
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-2 text-xs">
                                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                                    <span className="text-slate-400">
                                      Inicio: {clause.carenciaStart}
                                    </span>
                                    <span className="text-slate-600">→</span>
                                    <span className="text-amber-400 font-semibold">
                                      Vence: {clause.carenciaEnd}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Tope usage bar */}
                            {clause.category === "tope" &&
                              clause.usagePercent !== undefined && (
                                <div className="mt-2 max-w-xs">
                                  <div className="flex items-center justify-between text-[10px] mb-1">
                                    <span className="text-slate-500">
                                      Uso estimado
                                    </span>
                                    <span className="text-slate-300 font-semibold">
                                      {clause.usagePercent}%
                                      {clause.topeAmount &&
                                        ` de ${clause.topeAmount}`}
                                    </span>
                                  </div>
                                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-1000 ease-out ${getUsageBarColor(
                                        clause.usagePercent,
                                      )}`}
                                      style={{
                                        width: loaded
                                          ? `${clause.usagePercent}%`
                                          : "0%",
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>

                        {/* Right side badges */}
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          {/* Impact badge */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getImpactBadge(
                              clause.impact,
                            )}`}
                          >
                            {getImpactLabel(clause.impact)}
                          </span>

                          {/* Confidence badge */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${confidenceBadge.className}`}
                          >
                            {confidenceBadge.label}
                          </span>

                          {/* "Ver en documento" link */}
                          <button className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors mt-1">
                            <FileText className="w-3 h-3" />
                            Ver en documento
                            <ArrowUpRight className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredClauses.length === 0 && (
        <div className="bg-[#1c2333] border border-[#2d3548] rounded-xl p-12 text-center">
          <Eye className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">
            No hay clausulas con este filtro
          </p>
          <p className="text-slate-500 text-sm mt-1">
            Selecciona otra categoria para ver mas clausulas
          </p>
        </div>
      )}

      {/* Keyframe animation */}
      <style jsx global>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
