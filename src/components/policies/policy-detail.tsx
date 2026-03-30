"use client";

import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConfidenceBadge } from "@/components/policies/confidence-badge";
import { CoverageTable } from "@/components/policies/coverage-table";
import { ExclusionList } from "@/components/policies/exclusion-list";
import { INSURANCE_CATEGORIES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils/currency";
import type { InsuranceCategory, PolicyStatus } from "@prisma/client";

interface PolicyWithRelations {
  id: string;
  policyNumber?: string | null;
  depositCode?: string | null;
  insuranceCompany?: string | null;
  category: InsuranceCategory;
  subcategory?: string | null;
  ramo?: string | null;
  policyHolder?: string | null;
  insuredName?: string | null;
  insuredRut?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  issueDate?: string | null;
  renewalDate?: string | null;
  premium?: string | number | null;
  premiumCurrency?: string;
  premiumFrequency?: string | null;
  totalInsuredAmount?: string | number | null;
  status: PolicyStatus;
  isVerified: boolean;
  overallConfidence?: number | null;
  source?: string;
  coverages: Array<{
    id: string;
    name: string;
    description?: string | null;
    coveredAmount?: string | number | null;
    coveredPercent?: number | null;
    currency?: string;
    limitPerEvent?: string | number | null;
    limitAnnual?: string | number | null;
    confidence?: number | null;
    sourceText?: string | null;
  }>;
  exclusions: Array<{
    id: string;
    description: string;
    category?: string | null;
    isAbsolute: boolean;
    confidence?: number | null;
    sourceText?: string | null;
  }>;
  deductibles: Array<{
    id: string;
    name: string;
    amount?: string | number | null;
    percentage?: number | null;
    currency?: string;
    appliesTo?: string | null;
    frequency?: string | null;
    confidence?: number | null;
    sourceText?: string | null;
  }>;
  beneficiaries: Array<{
    id: string;
    name: string;
    rut?: string | null;
    relationship?: string | null;
    percentage?: number | null;
    isContingent: boolean;
    confidence?: number | null;
  }>;
}

interface PolicyDetailProps {
  policy: PolicyWithRelations;
  className?: string;
}

const STATUS_LABELS: Record<PolicyStatus, { label: string; color: string }> = {
  ACTIVE: { label: "Activa", color: "bg-green-50 text-green-700 border-green-200" },
  EXPIRED: { label: "Vencida", color: "bg-gray-100 text-gray-600 border-gray-200" },
  CANCELLED: { label: "Cancelada", color: "bg-red-50 text-red-700 border-red-200" },
  PENDING_VERIFICATION: {
    label: "Pendiente de verificacion",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  DRAFT: { label: "Borrador", color: "bg-gray-50 text-gray-500 border-gray-200" },
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "---";
  return new Date(dateStr).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function toNumber(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined) return null;
  const n = typeof val === "string" ? parseFloat(val) : val;
  return isNaN(n) ? null : n;
}

function SummaryField({
  label,
  value,
  children,
}: {
  label: string;
  value?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-gray-900">
        {children ?? value ?? "---"}
      </dd>
    </div>
  );
}

export function PolicyDetail({ policy, className }: PolicyDetailProps) {
  const catConfig = INSURANCE_CATEGORIES[policy.category];
  const statusConfig = STATUS_LABELS[policy.status];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {policy.insuranceCompany ?? "Poliza sin compania"}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{catConfig?.label ?? policy.category}</Badge>
            <Badge variant="outline" className={statusConfig?.color}>
              {statusConfig?.label ?? policy.status}
            </Badge>
            <ConfidenceBadge confidence={policy.overallConfidence} />
            {policy.isVerified && (
              <Badge className="bg-green-600 text-white">Verificada</Badge>
            )}
          </div>
        </div>
        {policy.policyNumber && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Numero de poliza</p>
            <p className="text-lg font-mono font-medium text-gray-900">
              {policy.policyNumber}
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="resumen">
        <TabsList variant="line">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="coberturas">
            Coberturas ({policy.coverages.length})
          </TabsTrigger>
          <TabsTrigger value="exclusiones">
            Exclusiones ({policy.exclusions.length})
          </TabsTrigger>
          <TabsTrigger value="deducibles">
            Deducibles ({policy.deductibles.length})
          </TabsTrigger>
          <TabsTrigger value="beneficiarios">
            Beneficiarios ({policy.beneficiaries.length})
          </TabsTrigger>
        </TabsList>

        {/* Resumen tab */}
        <TabsContent value="resumen">
          <Card>
            <CardContent>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <SummaryField label="Compania aseguradora" value={policy.insuranceCompany} />
                <SummaryField label="Numero de poliza" value={policy.policyNumber} />
                <SummaryField label="Categoria" value={catConfig?.label ?? policy.category} />
                <SummaryField label="Ramo" value={policy.ramo} />
                <SummaryField label="Tomador" value={policy.policyHolder} />
                <SummaryField label="Asegurado" value={policy.insuredName} />
                <SummaryField label="RUT asegurado" value={policy.insuredRut} />
                <SummaryField label="Codigo deposito" value={policy.depositCode} />
                <SummaryField label="Fecha inicio" value={formatDate(policy.startDate)} />
                <SummaryField label="Fecha termino" value={formatDate(policy.endDate)} />
                <SummaryField label="Fecha emision" value={formatDate(policy.issueDate)} />
                <SummaryField label="Fecha renovacion" value={formatDate(policy.renewalDate)} />
                <SummaryField label="Prima">
                  {toNumber(policy.premium) !== null
                    ? formatCurrency(
                        toNumber(policy.premium)!,
                        policy.premiumCurrency ?? "CLP"
                      )
                    : "---"}
                  {policy.premiumFrequency && (
                    <span className="ml-1 text-xs text-gray-500">
                      ({policy.premiumFrequency.toLowerCase()})
                    </span>
                  )}
                </SummaryField>
                <SummaryField label="Monto total asegurado">
                  {toNumber(policy.totalInsuredAmount) !== null
                    ? formatCurrency(
                        toNumber(policy.totalInsuredAmount)!,
                        policy.premiumCurrency ?? "CLP"
                      )
                    : "---"}
                </SummaryField>
                <SummaryField label="Confianza general">
                  <ConfidenceBadge confidence={policy.overallConfidence} />
                </SummaryField>
                <SummaryField label="Origen" value={policy.source?.replace(/_/g, " ") ?? "---"} />
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coberturas tab */}
        <TabsContent value="coberturas">
          <CoverageTable coverages={policy.coverages} />
        </TabsContent>

        {/* Exclusiones tab */}
        <TabsContent value="exclusiones">
          <ExclusionList exclusions={policy.exclusions} />
        </TabsContent>

        {/* Deducibles tab */}
        <TabsContent value="deducibles">
          {policy.deductibles.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              No se encontraron deducibles para esta poliza.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                    <th className="hidden px-4 py-3 text-right sm:table-cell">
                      Porcentaje
                    </th>
                    <th className="hidden px-4 py-3 md:table-cell">Aplica a</th>
                    <th className="hidden px-4 py-3 md:table-cell">
                      Frecuencia
                    </th>
                    <th className="px-4 py-3 text-center">Confianza</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {policy.deductibles.map((ded) => {
                    const amount = toNumber(ded.amount);
                    return (
                      <tr key={ded.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {ded.name}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {amount !== null
                            ? formatCurrency(amount, ded.currency ?? "CLP")
                            : "---"}
                        </td>
                        <td className="hidden px-4 py-3 text-right text-gray-700 sm:table-cell">
                          {ded.percentage !== null && ded.percentage !== undefined
                            ? `${ded.percentage}%`
                            : "---"}
                        </td>
                        <td className="hidden px-4 py-3 text-gray-500 md:table-cell">
                          {ded.appliesTo ?? "---"}
                        </td>
                        <td className="hidden px-4 py-3 text-gray-500 md:table-cell">
                          {ded.frequency ?? "---"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <ConfidenceBadge confidence={ded.confidence} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Beneficiarios tab */}
        <TabsContent value="beneficiarios">
          {policy.beneficiaries.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              No se encontraron beneficiarios para esta poliza.
            </div>
          ) : (
            <div className="space-y-3">
              {policy.beneficiaries.map((ben) => (
                <Card key={ben.id}>
                  <CardContent className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {ben.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        {ben.relationship && (
                          <span>Relacion: {ben.relationship}</span>
                        )}
                        {ben.rut && <span>RUT: {ben.rut}</span>}
                        {ben.percentage !== null && ben.percentage !== undefined && (
                          <span>Participacion: {ben.percentage}%</span>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        {ben.isContingent && (
                          <Badge
                            variant="outline"
                            className="bg-gray-50 text-gray-600 border-gray-200"
                          >
                            Contingente
                          </Badge>
                        )}
                        <ConfidenceBadge confidence={ben.confidence} />
                      </div>
                    </div>
                    {ben.percentage !== null && ben.percentage !== undefined && (
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {ben.percentage}%
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
