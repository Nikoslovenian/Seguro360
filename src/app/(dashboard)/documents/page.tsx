"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Shield,
  Upload,
  Plus,
  FileText,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Download,
  Trash2,
  CloudUpload,
  File,
  X,
  Image,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */

interface PolicyCard {
  id: string;
  name: string;
  company: string;
  category: string;
  categoryColor: string;
  status: "activa" | "por_vencer" | "vencida";
  statusLabel: string;
  statusColor: string;
  startDate: string;
  endDate: string;
  coverageAmount: string;
  companyInitials: string;
  companyBg: string;
  policyNumber: string;
  monthlyPremium: string;
}

interface DocumentItem {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  status: "procesado" | "procesando" | "pendiente" | "error";
  statusLabel: string;
}

interface NewPolicyForm {
  company: string;
  productName: string;
  category: string;
  policyNumber: string;
  startDate: string;
  endDate: string;
  monthlyPremium: string;
}

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

const categoryOptions = [
  "Salud",
  "Vida",
  "Hogar",
  "Vehiculo",
  "Accidentes",
  "Hospitalizacion",
  "Viaje",
  "Responsabilidad Civil",
  "Otro",
];

const categoryColorMap: Record<string, { badge: string; bg: string }> = {
  Salud: {
    badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    bg: "bg-cyan-600",
  },
  Vida: {
    badge: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    bg: "bg-purple-600",
  },
  Hogar: {
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    bg: "bg-amber-600",
  },
  Vehiculo: {
    badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    bg: "bg-emerald-600",
  },
  Accidentes: {
    badge: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    bg: "bg-pink-600",
  },
  Hospitalizacion: {
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    bg: "bg-blue-600",
  },
  Viaje: {
    badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    bg: "bg-orange-600",
  },
  "Responsabilidad Civil": {
    badge: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    bg: "bg-slate-600",
  },
  Otro: {
    badge: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    bg: "bg-gray-600",
  },
};

function getInitials(company: string): string {
  return company
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getTodayFormatted(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

function getFileExtIcon(type: string) {
  const t = type.toLowerCase();
  if (t === "pdf") return File;
  if (t === "jpg" || t === "jpeg" || t === "png") return Image;
  return File;
}

/* ------------------------------------------------------------------ */
/*  INITIAL MOCK DATA                                                  */
/* ------------------------------------------------------------------ */

const initialPolicies: PolicyCard[] = [
  {
    id: "pol-1",
    name: "Seguro Complementario Salud",
    company: "MetLife",
    category: "SALUD",
    categoryColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    status: "activa",
    statusLabel: "Activa",
    statusColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    startDate: "15/01/2026",
    endDate: "15/01/2027",
    coverageAmount: "$5.000.000 CLP",
    companyInitials: "ML",
    companyBg: "bg-blue-600",
    policyNumber: "SAL-2026-001",
    monthlyPremium: "$45.000",
  },
  {
    id: "pol-2",
    name: "Seguro de Vida",
    company: "Consorcio Nacional",
    category: "VIDA",
    categoryColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    status: "activa",
    statusLabel: "Activa",
    statusColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    startDate: "01/03/2026",
    endDate: "01/03/2027",
    coverageAmount: "$50.000.000 CLP",
    companyInitials: "CN",
    companyBg: "bg-purple-600",
    policyNumber: "VID-2026-042",
    monthlyPremium: "$32.000",
  },
  {
    id: "pol-3",
    name: "Seguro Vehiculo Todo Riesgo",
    company: "BCI Seguros",
    category: "VEHICULO",
    categoryColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    status: "por_vencer",
    statusLabel: "Por vencer",
    statusColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    startDate: "10/05/2025",
    endDate: "10/04/2026",
    coverageAmount: "$15.000.000 CLP",
    companyInitials: "BCI",
    companyBg: "bg-emerald-600",
    policyNumber: "VEH-2025-118",
    monthlyPremium: "$55.000",
  },
  {
    id: "pol-4",
    name: "SOAP Obligatorio",
    company: "Liberty Seguros",
    category: "VEHICULO",
    categoryColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    status: "activa",
    statusLabel: "Activa",
    statusColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    startDate: "01/04/2026",
    endDate: "31/03/2027",
    coverageAmount: "Segun ley",
    companyInitials: "LB",
    companyBg: "bg-sky-600",
    policyNumber: "SOAP-2026-003",
    monthlyPremium: "$8.500",
  },
];

const initialDocuments: DocumentItem[] = [
  {
    id: "doc-1",
    name: "Poliza_MetLife_Salud_2026.pdf",
    type: "PDF",
    size: "2.4 MB",
    uploadDate: "15/01/2026",
    status: "procesado",
    statusLabel: "Procesado",
  },
  {
    id: "doc-2",
    name: "Poliza_Consorcio_Vida_2026.pdf",
    type: "PDF",
    size: "1.8 MB",
    uploadDate: "01/03/2026",
    status: "procesado",
    statusLabel: "Procesado",
  },
  {
    id: "doc-3",
    name: "Condiciones_BCI_Auto.pdf",
    type: "PDF",
    size: "3.1 MB",
    uploadDate: "10/03/2026",
    status: "procesado",
    statusLabel: "Procesado",
  },
  {
    id: "doc-4",
    name: "SOAP_Liberty_2026.pdf",
    type: "PDF",
    size: "0.5 MB",
    uploadDate: "01/04/2026",
    status: "procesado",
    statusLabel: "Procesado",
  },
];

/* ------------------------------------------------------------------ */
/*  MAIN COMPONENT                                                     */
/* ------------------------------------------------------------------ */

export default function MisSegurosPage() {
  const [activeTab, setActiveTab] = useState<"polizas" | "documentos">("polizas");
  const [isDragging, setIsDragging] = useState(false);
  const [policies, setPolicies] = useState<PolicyCard[]>(initialPolicies);
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newPolicy, setNewPolicy] = useState<NewPolicyForm>({
    company: "",
    productName: "",
    category: "",
    policyNumber: "",
    startDate: "",
    endDate: "",
    monthlyPremium: "",
  });

  /* ----- Document processing simulation ----- */
  const processDocument = useCallback((docId: string) => {
    // After 3 seconds -> "Procesando..."
    setTimeout(() => {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId
            ? { ...d, status: "procesando" as const, statusLabel: "Procesando..." }
            : d
        )
      );
      // After 3 more seconds -> "Procesado"
      setTimeout(() => {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === docId
              ? { ...d, status: "procesado" as const, statusLabel: "Procesado" }
              : d
          )
        );
      }, 3000);
    }, 3000);
  }, []);

  /* ----- File handling ----- */
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      Array.from(files).forEach((file) => {
        const ext = file.name.split(".").pop()?.toUpperCase() || "FILE";
        const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const newDoc: DocumentItem = {
          id: docId,
          name: file.name,
          type: ext,
          size: formatFileSize(file.size),
          uploadDate: getTodayFormatted(),
          status: "pendiente",
          statusLabel: "Pendiente",
        };
        setDocuments((prev) => [newDoc, ...prev]);
        processDocument(docId);
      });
      // Switch to documents tab so user sees the upload
      setActiveTab("documentos");
    },
    [processDocument]
  );

  /* ----- Add policy ----- */
  const handleAddPolicy = () => {
    if (
      !newPolicy.company ||
      !newPolicy.productName ||
      !newPolicy.category ||
      !newPolicy.policyNumber
    ) {
      return;
    }

    const catKey = newPolicy.category;
    const colors = categoryColorMap[catKey] || categoryColorMap["Otro"];

    const policy: PolicyCard = {
      id: `pol-${Date.now()}`,
      name: newPolicy.productName,
      company: newPolicy.company,
      category: catKey.toUpperCase(),
      categoryColor: colors.badge,
      status: "activa",
      statusLabel: "Activa",
      statusColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      startDate: newPolicy.startDate ? formatDate(newPolicy.startDate) : "Sin fecha",
      endDate: newPolicy.endDate ? formatDate(newPolicy.endDate) : "Sin fecha",
      coverageAmount: newPolicy.monthlyPremium
        ? `$${Number(newPolicy.monthlyPremium).toLocaleString("es-CL")} CLP/mes`
        : "Sin especificar",
      companyInitials: getInitials(newPolicy.company),
      companyBg: colors.bg,
      policyNumber: newPolicy.policyNumber,
      monthlyPremium: newPolicy.monthlyPremium
        ? `$${Number(newPolicy.monthlyPremium).toLocaleString("es-CL")}`
        : "",
    };

    setPolicies((prev) => [policy, ...prev]);
    setNewPolicy({
      company: "",
      productName: "",
      category: "",
      policyNumber: "",
      startDate: "",
      endDate: "",
      monthlyPremium: "",
    });
    setShowAddModal(false);
  };

  /* ----- Delete document ----- */
  const handleDeleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    setDeleteConfirm(null);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 -m-6 p-6 min-h-full bg-[#0f1117]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#e2e8f0]">Mis Seguros</h1>
            <p className="text-sm text-[#94a3b8]">
              Gestiona tus polizas y documentos de seguro
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-400 hover:shadow-lg hover:shadow-blue-500/25"
        >
          <Plus className="h-4 w-4" />
          Agregar poliza
        </button>
      </div>

      {/* Upload zone (always visible) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          isDragging
            ? "border-blue-500 bg-blue-500/5"
            : "border-[#2d3548] bg-[#1c2333]/50 hover:border-[#3d4a63]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="flex flex-col items-center gap-3">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${
              isDragging ? "bg-blue-500/20" : "bg-[#0f1117]"
            }`}
          >
            <CloudUpload
              className={`h-7 w-7 ${isDragging ? "text-blue-400" : "text-[#94a3b8]"}`}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-[#e2e8f0]">
              Arrastra tus documentos aqui
            </p>
            <p className="mt-1 text-xs text-[#94a3b8]">
              o{" "}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                selecciona archivos
              </button>{" "}
              desde tu computador
            </p>
          </div>
          <p className="text-xs text-[#94a3b8]/50">
            PDF, JPG, PNG - Maximo 20MB por archivo
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 rounded-xl border border-[#2d3548] bg-[#1c2333] p-1">
        <button
          onClick={() => setActiveTab("polizas")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === "polizas"
              ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25"
              : "text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#0f1117]/50"
          }`}
        >
          <FileText className="h-4 w-4" />
          Mis Polizas
          <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-xs">
            {policies.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("documentos")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === "documentos"
              ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25"
              : "text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#0f1117]/50"
          }`}
        >
          <Upload className="h-4 w-4" />
          Documentos
          <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-xs">
            {documents.length}
          </span>
        </button>
      </div>

      {/* ============================================================ */}
      {/*  POLIZAS TAB                                                  */}
      {/* ============================================================ */}
      {activeTab === "polizas" && (
        <div className="space-y-4">
          {policies.length === 0 && (
            <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-12 text-center">
              <Shield className="h-12 w-12 mx-auto text-[#94a3b8]/30 mb-3" />
              <p className="text-[#94a3b8]">No tienes polizas agregadas aun.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 text-sm text-blue-400 hover:text-blue-300 underline"
              >
                Agregar tu primera poliza
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {policies.map((policy) => (
              <div
                key={policy.id}
                className="group rounded-2xl border border-[#2d3548] bg-[#1c2333] p-5 transition-all hover:border-[#3d4a63] hover:shadow-lg hover:shadow-black/20"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${policy.companyBg} text-white text-xs font-bold`}
                  >
                    {policy.companyInitials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${policy.categoryColor}`}
                      >
                        {policy.category}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${policy.statusColor}`}
                      >
                        {policy.status === "activa" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : policy.status === "por_vencer" ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {policy.statusLabel}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-[#e2e8f0] mb-0.5">
                      {policy.name}
                    </h3>

                    <p className="text-xs text-[#94a3b8] flex items-center gap-1 mb-1">
                      <Building2 className="h-3 w-3" />
                      {policy.company}
                    </p>

                    <p className="text-xs text-[#64748b] mb-3">
                      N° Poliza: {policy.policyNumber}
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {policy.startDate} - {policy.endDate}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#e2e8f0] font-medium">
                        <Shield className="h-3 w-3 text-blue-400" />
                        <span>{policy.coverageAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#2d3548]/50 flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-[#2d3548] bg-[#0f1117] px-3 py-2 text-xs font-medium text-[#e2e8f0] transition-all hover:border-blue-500/50 hover:text-blue-400">
                    <Eye className="h-3.5 w-3.5" />
                    Ver detalle
                  </button>
                  <button className="flex items-center justify-center gap-1.5 rounded-lg border border-[#2d3548] bg-[#0f1117] px-3 py-2 text-xs font-medium text-[#94a3b8] transition-all hover:border-[#3d4a63] hover:text-[#e2e8f0]">
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      setPolicies((prev) => prev.filter((p) => p.id !== policy.id))
                    }
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-[#2d3548] bg-[#0f1117] px-3 py-2 text-xs font-medium text-[#94a3b8] transition-all hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  DOCUMENTOS TAB                                               */}
      {/* ============================================================ */}
      {activeTab === "documentos" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-[#e2e8f0] uppercase tracking-wider mb-4">
              Documentos subidos ({documents.length})
            </h3>
            {documents.length === 0 && (
              <div className="rounded-xl border border-[#2d3548] bg-[#1c2333] p-10 text-center">
                <FileText className="h-10 w-10 mx-auto text-[#94a3b8]/30 mb-3" />
                <p className="text-sm text-[#94a3b8]">
                  No hay documentos subidos. Arrastra archivos o usa el boton de arriba.
                </p>
              </div>
            )}
            <div className="space-y-3">
              {documents.map((doc) => {
                const IconComp = getFileExtIcon(doc.type);
                const iconBg =
                  doc.type === "PDF"
                    ? "bg-red-500/10"
                    : doc.type === "JPG" || doc.type === "JPEG" || doc.type === "PNG"
                      ? "bg-blue-500/10"
                      : "bg-gray-500/10";
                const iconColor =
                  doc.type === "PDF"
                    ? "text-red-400"
                    : doc.type === "JPG" || doc.type === "JPEG" || doc.type === "PNG"
                      ? "text-blue-400"
                      : "text-gray-400";

                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-4 rounded-xl border border-[#2d3548] bg-[#1c2333] p-4 transition-all hover:border-[#3d4a63]"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
                    >
                      <IconComp className={`h-5 w-5 ${iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#e2e8f0] truncate">
                        {doc.name}
                      </p>
                      <p className="text-xs text-[#94a3b8]">
                        {doc.type} - {doc.size} - Subido el {doc.uploadDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          doc.status === "procesado"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : doc.status === "procesando"
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                              : doc.status === "pendiente"
                                ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                : "bg-red-500/20 text-red-400 border-red-500/30"
                        }`}
                      >
                        {doc.status === "procesado" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : doc.status === "procesando" ? (
                          <Clock className="h-3 w-3 animate-spin" />
                        ) : doc.status === "pendiente" ? (
                          <Clock className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {doc.statusLabel}
                      </span>
                      <button className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] hover:bg-[#0f1117] hover:text-[#e2e8f0] transition-colors">
                        <Download className="h-4 w-4" />
                      </button>

                      {/* Delete with confirmation */}
                      {deleteConfirm === doc.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="rounded-lg bg-red-500/20 px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/30 transition-colors"
                          >
                            Si
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="rounded-lg bg-[#2d3548] px-2 py-1 text-xs font-medium text-[#94a3b8] hover:bg-[#3d4a63] transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(doc.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  AGREGAR POLIZA MODAL                                         */}
      {/* ============================================================ */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto rounded-2xl border border-[#2d3548] bg-[#1c2333] p-6 shadow-2xl shadow-black/50">
            {/* Close button */}
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] hover:bg-[#0f1117] hover:text-[#e2e8f0] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#e2e8f0]">
                  Agregar nueva poliza
                </h2>
                <p className="text-sm text-[#94a3b8]">
                  Ingresa los datos de tu poliza de seguro
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Compania */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#e2e8f0]">
                  Compania <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: MetLife, BCI Seguros, Consorcio..."
                  value={newPolicy.company}
                  onChange={(e) =>
                    setNewPolicy({ ...newPolicy, company: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#2d3548] bg-[#0f1117] px-4 py-3 text-sm text-[#e2e8f0] placeholder-[#64748b] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
                />
              </div>

              {/* Nombre del producto */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#e2e8f0]">
                  Nombre del producto <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Seguro Complementario Salud"
                  value={newPolicy.productName}
                  onChange={(e) =>
                    setNewPolicy({ ...newPolicy, productName: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#2d3548] bg-[#0f1117] px-4 py-3 text-sm text-[#e2e8f0] placeholder-[#64748b] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
                />
              </div>

              {/* Categoria */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#e2e8f0]">
                  Categoria <span className="text-red-400">*</span>
                </label>
                <select
                  value={newPolicy.category}
                  onChange={(e) =>
                    setNewPolicy({ ...newPolicy, category: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#2d3548] bg-[#0f1117] px-4 py-3 text-sm text-[#e2e8f0] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors appearance-none"
                >
                  <option value="" className="bg-[#0f1117] text-[#64748b]">
                    Selecciona una categoria
                  </option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#0f1117]">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Numero de poliza */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#e2e8f0]">
                  Numero de poliza <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: SAL-2026-001"
                  value={newPolicy.policyNumber}
                  onChange={(e) =>
                    setNewPolicy({ ...newPolicy, policyNumber: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#2d3548] bg-[#0f1117] px-4 py-3 text-sm text-[#e2e8f0] placeholder-[#64748b] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
                />
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#e2e8f0]">
                    Fecha inicio
                  </label>
                  <input
                    type="date"
                    value={newPolicy.startDate}
                    onChange={(e) =>
                      setNewPolicy({ ...newPolicy, startDate: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#2d3548] bg-[#0f1117] px-4 py-3 text-sm text-[#e2e8f0] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors [color-scheme:dark]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#e2e8f0]">
                    Fecha termino
                  </label>
                  <input
                    type="date"
                    value={newPolicy.endDate}
                    onChange={(e) =>
                      setNewPolicy({ ...newPolicy, endDate: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#2d3548] bg-[#0f1117] px-4 py-3 text-sm text-[#e2e8f0] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Prima mensual */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#e2e8f0]">
                  Prima mensual (CLP)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#64748b]">
                    $
                  </span>
                  <input
                    type="number"
                    placeholder="45000"
                    value={newPolicy.monthlyPremium}
                    onChange={(e) =>
                      setNewPolicy({ ...newPolicy, monthlyPremium: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#2d3548] bg-[#0f1117] pl-8 pr-14 py-3 text-sm text-[#e2e8f0] placeholder-[#64748b] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#64748b]">
                    CLP
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-xl border border-[#2d3548] bg-[#0f1117] px-4 py-3 text-sm font-medium text-[#94a3b8] transition-all hover:border-[#3d4a63] hover:text-[#e2e8f0]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddPolicy}
                  disabled={
                    !newPolicy.company ||
                    !newPolicy.productName ||
                    !newPolicy.category ||
                    !newPolicy.policyNumber
                  }
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-400 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  DELETE CONFIRMATION OVERLAY (for mobile / extra safety)       */}
      {/* ============================================================ */}
    </div>
  );
}
