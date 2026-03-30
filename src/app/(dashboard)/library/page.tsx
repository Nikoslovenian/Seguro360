"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Library,
  Search,
  ChevronDown,
  ExternalLink,
  AlertTriangle,
  Heart,
  Shield,
  Car,
  Home,
  Zap,
} from "lucide-react";

interface LibraryEntry {
  id: string;
  productName: string;
  company: string;
  category: string;
  categoryColor: string;
  categoryIcon: React.ComponentType<{ className?: string }>;
  description: string;
}

const mockLibraryEntries: LibraryEntry[] = [
  {
    id: "lib-1",
    productName: "Seguro Complementario Salud",
    company: "MetLife",
    category: "SALUD",
    categoryColor:
      "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    categoryIcon: Heart,
    description:
      "Cobertura complementaria para gastos medicos ambulatorios y hospitalizacion no cubiertos por Fonasa o Isapre. Incluye consultas, examenes, cirugia y medicamentos.",
  },
  {
    id: "lib-2",
    productName: "Seguro de Vida Individual",
    company: "Consorcio Nacional",
    category: "VIDA",
    categoryColor:
      "bg-purple-500/20 text-purple-400 border-purple-500/30",
    categoryIcon: Shield,
    description:
      "Proteccion financiera para beneficiarios en caso de fallecimiento del asegurado. Incluye cobertura por muerte natural, accidental e invalidez total y permanente.",
  },
  {
    id: "lib-3",
    productName: "Seguro Automotriz Todo Riesgo",
    company: "BCI Seguros",
    category: "VEHICULO",
    categoryColor:
      "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    categoryIcon: Car,
    description:
      "Cobertura integral para tu vehiculo: danos propios, robo, responsabilidad civil, asistencia en ruta y danos a terceros. Incluye grua y auto de reemplazo.",
  },
  {
    id: "lib-4",
    productName: "Seguro de Hogar e Incendio",
    company: "Suramericana",
    category: "HOGAR",
    categoryColor:
      "bg-amber-500/20 text-amber-400 border-amber-500/30",
    categoryIcon: Home,
    description:
      "Proteccion para tu vivienda y contenido contra incendio, terremoto, robo, danos por agua y responsabilidad civil familiar. Incluye asistencia hogar.",
  },
  {
    id: "lib-5",
    productName: "Seguro de Accidentes Personales",
    company: "HDI Seguros",
    category: "ACCIDENTES",
    categoryColor:
      "bg-pink-500/20 text-pink-400 border-pink-500/30",
    categoryIcon: Zap,
    description:
      "Cobertura ante accidentes que causen invalidez temporal, permanente o fallecimiento. Incluye gastos medicos por accidente, rehabilitacion e indemnizacion.",
  },
  {
    id: "lib-6",
    productName: "SOAP Obligatorio",
    company: "Liberty Seguros",
    category: "VEHICULO",
    categoryColor:
      "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    categoryIcon: Car,
    description:
      "Seguro Obligatorio de Accidentes Personales. Cobertura legal obligatoria para todos los vehiculos motorizados que circulen en Chile. Cubre gastos medicos y muerte de ocupantes.",
  },
];

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");

  const categories = ["all", "SALUD", "VIDA", "VEHICULO", "HOGAR", "ACCIDENTES"];
  const companies = [
    "all",
    "MetLife",
    "Consorcio Nacional",
    "BCI Seguros",
    "Suramericana",
    "HDI Seguros",
    "Liberty Seguros",
  ];

  const filteredEntries = mockLibraryEntries.filter((entry) => {
    const matchesSearch =
      searchQuery === "" ||
      entry.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || entry.category === categoryFilter;
    const matchesCompany =
      companyFilter === "all" || entry.company === companyFilter;
    return matchesSearch && matchesCategory && matchesCompany;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 -m-6 p-6 min-h-full bg-[#0f1117]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500">
          <Library className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#e2e8f0]">
            Biblioteca de Polizas
          </h1>
          <p className="text-sm text-[#94a3b8]">
            Polizas modelo y referenciales del mercado chileno
          </p>
        </div>
      </div>

      {/* Disclaimer banner */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <p className="text-sm text-amber-200">
            Las polizas modelo son referenciales. No reemplazan la poliza
            contratada por el asegurado. Consulte siempre su poliza vigente
            para conocer las condiciones exactas de su cobertura.
          </p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, compania o descripcion..."
            className="w-full rounded-xl border border-[#2d3548] bg-[#1c2333] pl-11 pr-4 py-3 text-sm text-[#e2e8f0] placeholder-[#94a3b8]/50 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
          />
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none rounded-xl border border-[#2d3548] bg-[#1c2333] pl-4 pr-10 py-2.5 text-sm text-[#e2e8f0] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors cursor-pointer"
            >
              <option value="all">Todas las categorias</option>
              {categories.slice(1).map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0) + cat.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="appearance-none rounded-xl border border-[#2d3548] bg-[#1c2333] pl-4 pr-10 py-2.5 text-sm text-[#e2e8f0] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors cursor-pointer"
            >
              <option value="all">Todas las companias</option>
              {companies.slice(1).map((comp) => (
                <option key={comp} value={comp}>
                  {comp}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
          </div>

          <span className="flex items-center text-xs text-[#94a3b8]">
            {filteredEntries.length} resultado
            {filteredEntries.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredEntries.map((entry) => {
          const Icon = entry.categoryIcon;
          return (
            <div
              key={entry.id}
              className="group rounded-2xl border border-[#2d3548] bg-[#1c2333] p-5 transition-all hover:border-[#3d4a63] hover:shadow-lg hover:shadow-black/20"
            >
              {/* Category badge and icon */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f1117]">
                  <Icon className="h-5 w-5 text-blue-400" />
                </div>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${entry.categoryColor}`}
                >
                  {entry.category}
                </span>
              </div>

              {/* Company */}
              <p className="text-xs text-[#94a3b8] mb-1">{entry.company}</p>

              {/* Product name */}
              <h3 className="text-base font-semibold text-[#e2e8f0] mb-2">
                {entry.productName}
              </h3>

              {/* Reference label */}
              <p className="text-xs text-[#94a3b8]/60 italic mb-3">
                Poliza modelo / referencial
              </p>

              {/* Description */}
              <p className="text-sm text-[#94a3b8] leading-relaxed mb-4 line-clamp-3">
                {entry.description}
              </p>

              {/* Action */}
              <Link
                href={`/library/${entry.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#2d3548] bg-[#0f1117] px-4 py-2 text-sm font-medium text-[#e2e8f0] transition-all hover:border-blue-500/50 hover:text-blue-400 group-hover:border-blue-500/30"
              >
                Ver detalle
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          );
        })}
      </div>

      {filteredEntries.length === 0 && (
        <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-12 text-center">
          <Search className="mx-auto h-10 w-10 text-[#94a3b8]/30 mb-3" />
          <p className="text-sm text-[#94a3b8]">
            No se encontraron polizas con los filtros seleccionados.
          </p>
        </div>
      )}
    </div>
  );
}
