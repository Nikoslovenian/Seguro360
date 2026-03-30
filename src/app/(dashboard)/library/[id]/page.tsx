"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Building2,
  Calendar,
  FileText,
} from "lucide-react";

const mockDetail = {
  id: "lib-1",
  productName: "Seguro Complementario Salud",
  company: "MetLife",
  category: "SALUD",
  categoryColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  description:
    "Cobertura complementaria para gastos medicos ambulatorios y hospitalizacion no cubiertos por Fonasa o Isapre. Incluye consultas, examenes, cirugia y medicamentos.",
  coverages: [
    {
      name: "Hospitalizacion",
      description: "Cobertura de sala, pension, honorarios medicos y quirurgicos durante hospitalizacion.",
      limit: "Hasta $5.000.000 CLP por evento",
    },
    {
      name: "Consultas medicas",
      description: "Consultas ambulatorias con medicos especialistas y generales.",
      limit: "Hasta $50.000 CLP por consulta, maximo 24 al ano",
    },
    {
      name: "Examenes y diagnostico",
      description: "Examenes de laboratorio, imagenologia (rayos X, resonancia, scanner, ecografia).",
      limit: "Hasta $1.500.000 CLP anuales",
    },
    {
      name: "Cirugia ambulatoria",
      description: "Procedimientos quirurgicos que no requieren hospitalizacion.",
      limit: "Hasta $3.000.000 CLP por evento",
    },
    {
      name: "Medicamentos",
      description: "Reembolso de medicamentos con receta medica en farmacias convenidas.",
      limit: "Hasta $500.000 CLP anuales",
    },
    {
      name: "Urgencia",
      description: "Atencion de urgencia en clinicas y hospitales de la red convenida.",
      limit: "Hasta $2.000.000 CLP por evento",
    },
  ],
  exclusions: [
    "Enfermedades o condiciones preexistentes no declaradas al momento de la contratacion",
    "Cirugia estetica o cosmetica sin indicacion medica",
    "Tratamientos dentales (salvo por accidente)",
    "Medicina alternativa no reconocida por la Superintendencia de Salud",
    "Lesiones autoinfligidas o por participacion en actividades de alto riesgo",
    "Embarazo y parto (salvo complicaciones medicas cubiertas)",
    "Tratamientos experimentales no aprobados por el ISP",
    "Lentes opticos y audifonos",
  ],
  generalInfo: {
    deductible: "$200.000 CLP por evento",
    copay: "20% del monto cubierto",
    waitingPeriod: "6 meses para enfermedades preexistentes declaradas",
    renewalType: "Renovacion anual automatica",
    network: "Red preferente de clinicas y centros medicos convenidos",
    territory: "Territorio nacional (Chile)",
    maxAge: "Ingreso hasta 65 anos, permanencia hasta 75 anos",
  },
};

interface LibraryDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function LibraryDetailPage({ params }: LibraryDetailPageProps) {
  const { id } = use(params);

  return (
    <div className="mx-auto max-w-4xl space-y-6 -m-6 p-6 min-h-full bg-[#0f1117]">
      {/* Back button */}
      <Link
        href="/library"
        className="inline-flex items-center gap-2 text-sm text-[#94a3b8] hover:text-[#e2e8f0] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a la biblioteca
      </Link>

      {/* Disclaimer */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <p className="text-sm text-amber-200">
            Esta es una poliza modelo referencial. No reemplaza la poliza
            contratada. Las condiciones reales pueden variar segun el plan
            contratado y las condiciones particulares de cada asegurado.
          </p>
        </div>
      </div>

      {/* Header card */}
      <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${mockDetail.categoryColor}`}
              >
                {mockDetail.category}
              </span>
              <span className="text-xs text-[#94a3b8]/60 italic">
                Poliza modelo / referencial
              </span>
            </div>
            <h1 className="text-xl font-bold text-[#e2e8f0] mb-1">
              {mockDetail.productName}
            </h1>
            <p className="text-sm text-[#94a3b8] flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              {mockDetail.company}
            </p>
            <p className="mt-3 text-sm text-[#94a3b8] leading-relaxed">
              {mockDetail.description}
            </p>
          </div>
        </div>
      </div>

      {/* Coberturas tipicas */}
      <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-6">
        <h2 className="text-lg font-semibold text-[#e2e8f0] flex items-center gap-2 mb-5">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          Coberturas Tipicas
        </h2>
        <div className="space-y-4">
          {mockDetail.coverages.map((cov, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[#2d3548] bg-[#0f1117] p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#e2e8f0] mb-1">
                    {cov.name}
                  </h3>
                  <p className="text-sm text-[#94a3b8]">{cov.description}</p>
                </div>
                <span className="shrink-0 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-400 whitespace-nowrap">
                  {cov.limit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exclusiones comunes */}
      <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-6">
        <h2 className="text-lg font-semibold text-[#e2e8f0] flex items-center gap-2 mb-5">
          <XCircle className="h-5 w-5 text-red-400" />
          Exclusiones Comunes
        </h2>
        <div className="space-y-3">
          {mockDetail.exclusions.map((exc, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-xl border border-[#2d3548]/50 bg-[#0f1117] p-3"
            >
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                <XCircle className="h-3 w-3 text-red-400" />
              </div>
              <p className="text-sm text-[#94a3b8]">{exc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Informacion general */}
      <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-6">
        <h2 className="text-lg font-semibold text-[#e2e8f0] flex items-center gap-2 mb-5">
          <Info className="h-5 w-5 text-blue-400" />
          Informacion General
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { label: "Deducible", value: mockDetail.generalInfo.deductible },
            { label: "Copago", value: mockDetail.generalInfo.copay },
            { label: "Periodo de carencia", value: mockDetail.generalInfo.waitingPeriod },
            { label: "Tipo de renovacion", value: mockDetail.generalInfo.renewalType },
            { label: "Red de prestadores", value: mockDetail.generalInfo.network },
            { label: "Territorio", value: mockDetail.generalInfo.territory },
            { label: "Edad maxima", value: mockDetail.generalInfo.maxAge },
          ].map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[#2d3548] bg-[#0f1117] p-4"
            >
              <p className="text-xs text-[#94a3b8] mb-1">{item.label}</p>
              <p className="text-sm font-medium text-[#e2e8f0]">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333]/50 p-4">
        <div className="flex gap-3">
          <FileText className="h-5 w-5 shrink-0 text-[#94a3b8] mt-0.5" />
          <p className="text-xs text-[#94a3b8]">
            La informacion presentada corresponde a condiciones tipicas del
            mercado asegurador chileno para este tipo de producto. Las
            condiciones especificas de su poliza pueden diferir. Consulte
            siempre su poliza vigente y la Superintendencia de Valores y
            Seguros (CMF) para informacion oficial.
          </p>
        </div>
      </div>
    </div>
  );
}
