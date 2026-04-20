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
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { ApiResponse, PaginatedResponse } from "@/types/api";

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
/*  API RESPONSE SHAPES                                                */
/* ------------------------------------------------------------------ */

interface ApiPolicy {
  id: string;
  policyNumber?: string | null;
  insuranceCompany?: string | null;
  category: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  totalInsuredAmount?: number | null;
  premium?: number | null;
  premiumFrequency?: string | null;
  overallConfidence?: number | null;
  subcategory?: string | null;
  policyHolder?: string | null;
  insuredName?: string | null;
  sourceDocument?: { id: string; fileName: string } | null;
  coverages?: Array<{ id: string; name: string; coveredAmount?: number | null }>;
}

interface ApiDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  processingStatus: string;
  processingError?: string | null;
  createdAt: string;
  updatedAt: string;
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

/* Map API category enum -> display name for color lookup */
const categoryEnumToDisplay: Record<string, string> = {
  SALUD: "Salud",
  VIDA: "Vida",
  HOGAR: "Hogar",
  VEHICULO: "Vehiculo",
  ACCIDENTES: "Accidentes",
  HOSPITALIZACION: "Hospitalizacion",
  INVALIDEZ: "Otro",
  RESPONSABILIDAD_CIVIL: "Responsabilidad Civil",
  VIAJE: "Viaje",
  OTRO: "Otro",
};

/* Map API category enum -> company bg color */
const categoryBgMap: Record<string, string> = {
  SALUD: "bg-cyan-600",
  VIDA: "bg-purple-600",
  HOGAR: "bg-amber-600",
  VEHICULO: "bg-emerald-600",
  ACCIDENTES: "bg-pink-600",
  HOSPITALIZACION: "bg-blue-600",
  INVALIDEZ: "bg-red-600",
  RESPONSABILIDAD_CIVIL: "bg-slate-600",
  VIAJE: "bg-orange-600",
  OTRO: "bg-gray-600",
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
  // Handle both yyyy-mm-dd and ISO date strings
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    // Fallback for yyyy-mm-dd format
    const [y, m, day] = dateStr.split("-");
    return `${day}/${m}/${y}`;
  }
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
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
  if (t === "pdf" || t === "application/pdf") return File;
  if (["jpg", "jpeg", "png", "image/jpeg", "image/png"].includes(t)) return Image;
  return File;
}

function mapProcessingStatus(
  status: string,
): { status: DocumentItem["status"]; label: string } {
  switch (status) {
    case "COMPLETED":
      return { status: "procesado", label: "Procesado" };
    case "PENDING":
    case "QUEUED":
      return { status: "pendiente", label: "Pendiente" };
    case "EXTRACTING_TEXT":
    case "RUNNING_OCR":
    case "EXTRACTING_STRUCTURED":
    case "GENERATING_EMBEDDINGS":
      return { status: "procesando", label: "Procesando..." };
    case "FAILED":
    case "NEEDS_REVIEW":
      return { status: "error", label: "Error" };
    default:
      return { status: "pendiente", label: status };
  }
}

function mapPolicyStatus(
  status: string,
  endDateStr?: string | null,
): { status: PolicyCard["status"]; label: string; color: string } {
  const now = new Date();
  const endDate = endDateStr ? new Date(endDateStr) : null;
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (status === "EXPIRED" || status === "CANCELLED") {
    return {
      status: "vencida",
      label: status === "EXPIRED" ? "Vencida" : "Cancelada",
      color: "bg-red-500/20 text-red-400 border-red-500/30",
    };
  }

  if (endDate && endDate <= thirtyDays && endDate >= now) {
    return {
      status: "por_vencer",
      label: "Por vencer",
      color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    };
  }

  if (status === "PENDING_VERIFICATION" || status === "DRAFT") {
    return {
      status: "activa",
      label: status === "DRAFT" ? "Borrador" : "Pendiente",
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    };
  }

  return {
    status: "activa",
    label: "Activa",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  };
}

function apiPolicyToCard(p: ApiPolicy): PolicyCard {
  const displayCat = categoryEnumToDisplay[p.category] || "Otro";
  const catColors = categoryColorMap[displayCat] || categoryColorMap["Otro"];
  const company = p.insuranceCompany || "Sin compania";
  const statusInfo = mapPolicyStatus(p.status, p.endDate);

  const coverageStr = p.totalInsuredAmount
    ? `$${p.totalInsuredAmount.toLocaleString("es-CL")} CLP`
    : "Sin especificar";

  const premiumStr = p.premium
    ? `$${p.premium.toLocaleString("es-CL")}`
    : "";

  // Build a descriptive name
  const name = p.policyHolder || p.insuredName || `Poliza ${displayCat}`;

  return {
    id: p.id,
    name: p.policyNumber ? `${displayCat} - ${p.policyNumber}` : name,
    company,
    category: p.category,
    categoryColor: catColors.badge,
    status: statusInfo.status,
    statusLabel: statusInfo.label,
    statusColor: statusInfo.color,
    startDate: p.startDate ? formatDate(p.startDate) : "Sin fecha",
    endDate: p.endDate ? formatDate(p.endDate) : "Sin fecha",
    coverageAmount: coverageStr,
    companyInitials: getInitials(company),
    companyBg: categoryBgMap[p.category] || "bg-gray-600",
    policyNumber: p.policyNumber || "Sin numero",
    monthlyPremium: premiumStr,
  };
}

function apiDocumentToItem(d: ApiDocument): DocumentItem {
  const ext = d.fileName.split(".").pop()?.toUpperCase() || d.fileType.toUpperCase();
  const statusInfo = mapProcessingStatus(d.processingStatus);

  return {
    id: d.id,
    name: d.fileName,
    type: ext,
    size: formatFileSize(d.fileSize),
    uploadDate: formatDate(d.createdAt),
    status: statusInfo.status,
    statusLabel: statusInfo.label,
  };
}

/* ------------------------------------------------------------------ */
/*  SKELETON COMPONENTS                                                */
/* ------------------------------------------------------------------ */

function SkeletonPolicyCard() {
  return (
    <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-[#2d3548] shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="h-5 w-16 rounded-full bg-[#2d3548]" />
            <div className="h-5 w-14 rounded-full bg-[#2d3548]" />
          </div>
          <div className="h-4 w-48 rounded bg-[#2d3548]" />
          <div className="h-3 w-24 rounded bg-[#2d3548]" />
          <div className="h-3 w-32 rounded bg-[#2d3548]" />
          <div className="flex gap-4">
            <div className="h-3 w-36 rounded bg-[#2d3548]" />
            <div className="h-3 w-28 rounded bg-[#2d3548]" />
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-[#2d3548]/50 flex gap-2">
        <div className="flex-1 h-9 rounded-lg bg-[#2d3548]" />
        <div className="h-9 w-9 rounded-lg bg-[#2d3548]" />
        <div className="h-9 w-9 rounded-lg bg-[#2d3548]" />
      </div>
    </div>
  );
}

function SkeletonDocumentRow() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-[#2d3548] bg-[#1c2333] p-4 animate-pulse">
      <div className="h-10 w-10 rounded-lg bg-[#2d3548] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-48 rounded bg-[#2d3548]" />
        <div className="h-3 w-36 rounded bg-[#2d3548]" />
      </div>
      <div className="h-5 w-20 rounded-full bg-[#2d3548]" />
      <div className="h-8 w-8 rounded-lg bg-[#2d3548]" />
      <div className="h-8 w-8 rounded-lg bg-[#2d3548]" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN COMPONENT                                                     */
/* ------------------------------------------------------------------ */

export default function MisSegurosPage() {
  const [activeTab, setActiveTab] = useState<"polizas" | "documentos">("polizas");
  const [isDragging, setIsDragging] = useState(false);
  const [policies, setPolicies] = useState<PolicyCard[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [errorPolicies, setErrorPolicies] = useState<string | null>(null);
  const [errorDocuments, setErrorDocuments] = useState<string | null>(null);

  const [newPolicy, setNewPolicy] = useState<NewPolicyForm>({
    company: "",
    productName: "",
    category: "",
    policyNumber: "",
    startDate: "",
    endDate: "",
    monthlyPremium: "",
  });

  /* ----- Fetch policies from API ----- */
  const fetchPolicies = useCallback(async () => {
    setLoadingPolicies(true);
    setErrorPolicies(null);
    try {
      const res = await fetch("/api/policies?pageSize=100");
      const json: ApiResponse<PaginatedResponse<ApiPolicy>> = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Error al cargar polizas");
      }
      const items = json.data?.items ?? [];
      setPolicies(items.map(apiPolicyToCard));
    } catch (err) {
      console.error("[Documents] fetchPolicies error:", err);
      setErrorPolicies(err instanceof Error ? err.message : "Error al cargar polizas");
    } finally {
      setLoadingPolicies(false);
    }
  }, []);

  /* ----- Fetch documents from API ----- */
  const fetchDocuments = useCallback(async () => {
    setLoadingDocuments(true);
    setErrorDocuments(null);
    try {
      const res = await fetch("/api/documents?page=1&pageSize=50");
      const json: ApiResponse<PaginatedResponse<ApiDocument>> = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Error al cargar documentos");
      }
      const items = json.data?.items ?? [];
      setDocuments(items.map(apiDocumentToItem));
    } catch (err) {
      console.error("[Documents] fetchDocuments error:", err);
      setErrorDocuments(err instanceof Error ? err.message : "Error al cargar documentos");
    } finally {
      setLoadingDocuments(false);
    }
  }, []);

  /* ----- Initial fetch ----- */
  useEffect(() => {
    fetchPolicies();
    fetchDocuments();
  }, [fetchPolicies, fetchDocuments]);

  /* ----- Real file upload via presign + S3 + process ----- */
  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      setActiveTab("documentos");

      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop()?.toUpperCase() || "FILE";
        const tempId = `uploading-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

        // Show optimistic pending item
        const pendingDoc: DocumentItem = {
          id: tempId,
          name: file.name,
          type: ext,
          size: formatFileSize(file.size),
          uploadDate: getTodayFormatted(),
          status: "pendiente",
          statusLabel: "Subiendo...",
        };
        setDocuments((prev) => [pendingDoc, ...prev]);

        try {
          // Step 1: Get presigned URL
          const presignRes = await fetch("/api/documents/presign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size }),
          });
          if (!presignRes.ok) throw new Error("Error al obtener URL de subida");
          const presignData = await presignRes.json();
          const { presignedUrl, documentId } = presignData.data;

          // Update with real ID
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === tempId ? { ...d, id: documentId, statusLabel: "Subiendo archivo..." } : d
            )
          );

          // Step 2: Upload to S3
          await fetch(presignedUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });

          setDocuments((prev) =>
            prev.map((d) =>
              d.id === documentId
                ? { ...d, status: "procesando" as const, statusLabel: "En cola..." }
                : d
            )
          );

          // Step 3: Trigger processing
          await fetch("/api/documents/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ documentId }),
          });

          setDocuments((prev) =>
            prev.map((d) =>
              d.id === documentId
                ? { ...d, status: "procesando" as const, statusLabel: "Procesando..." }
                : d
            )
          );
        } catch (err) {
          console.error("[Upload] Error:", err);
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === tempId
                ? { ...d, status: "error" as const, statusLabel: "Error al subir" }
                : d
            )
          );
        }
      }
    },
    []
  );

  /* ----- Poll for processing status updates ----- */
  useEffect(() => {
    const hasProcessing = documents.some((d) =>
      ["pendiente", "procesando"].includes(d.status)
    );
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchDocuments();
    }, 3000);

    return () => clearInterval(interval);
  }, [documents, fetchDocuments]);

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
  const handleDeleteDocument = async (docId: string) => {
    // Optimistically remove from UI
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    setDeleteConfirm(null);

    // Also call API to delete (fire-and-forget for local temp docs)
    try {
      await fetch(`/api/documents/${docId}`, { method: "DELETE" });
    } catch {
      // If it fails (e.g. temp doc not in DB), that's fine
    }
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
            {loadingPolicies ? "..." : policies.length}
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
            {loadingDocuments ? "..." : documents.length}
          </span>
        </button>
      </div>

      {/* ============================================================ */}
      {/*  POLIZAS TAB                                                  */}
      {/* ============================================================ */}
      {activeTab === "polizas" && (
        <div className="space-y-4">
          {/* Loading state */}
          {loadingPolicies && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonPolicyCard key={i} />
              ))}
            </div>
          )}

          {/* Error state */}
          {!loadingPolicies && errorPolicies && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
              <AlertTriangle className="h-10 w-10 mx-auto text-red-400 mb-3" />
              <h3 className="text-lg font-semibold text-[#e2e8f0] mb-2">
                Error al cargar polizas
              </h3>
              <p className="text-sm text-[#94a3b8] mb-4">{errorPolicies}</p>
              <button
                onClick={fetchPolicies}
                className="inline-flex items-center gap-2 rounded-xl border border-[#2d3548] bg-[#1c2333] px-4 py-2.5 text-sm font-medium text-[#e2e8f0] transition-all hover:border-[#3d4a63]"
              >
                <RefreshCw className="h-4 w-4" />
                Reintentar
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loadingPolicies && !errorPolicies && policies.length === 0 && (
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

          {/* Policies grid */}
          {!loadingPolicies && !errorPolicies && policies.length > 0 && (
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
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/*  DOCUMENTOS TAB                                               */}
      {/* ============================================================ */}
      {activeTab === "documentos" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-[#e2e8f0] uppercase tracking-wider mb-4">
              Documentos subidos ({loadingDocuments ? "..." : documents.length})
            </h3>

            {/* Loading state */}
            {loadingDocuments && (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonDocumentRow key={i} />
                ))}
              </div>
            )}

            {/* Error state */}
            {!loadingDocuments && errorDocuments && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center">
                <AlertTriangle className="h-10 w-10 mx-auto text-red-400 mb-3" />
                <h3 className="text-lg font-semibold text-[#e2e8f0] mb-2">
                  Error al cargar documentos
                </h3>
                <p className="text-sm text-[#94a3b8] mb-4">{errorDocuments}</p>
                <button
                  onClick={fetchDocuments}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#2d3548] bg-[#1c2333] px-4 py-2.5 text-sm font-medium text-[#e2e8f0] transition-all hover:border-[#3d4a63]"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reintentar
                </button>
              </div>
            )}

            {/* Empty state */}
            {!loadingDocuments && !errorDocuments && documents.length === 0 && (
              <div className="rounded-xl border border-[#2d3548] bg-[#1c2333] p-10 text-center">
                <FileText className="h-10 w-10 mx-auto text-[#94a3b8]/30 mb-3" />
                <p className="text-sm text-[#94a3b8]">
                  No hay documentos subidos. Arrastra archivos o usa el boton de arriba.
                </p>
              </div>
            )}

            {/* Documents list */}
            {!loadingDocuments && !errorDocuments && documents.length > 0 && (
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
            )}
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
