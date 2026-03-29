import type { InsuranceCategory, ConfidenceLabel } from "@prisma/client";
import type { ProtectionLevel } from "@/lib/constants";

export interface ProtectionScore {
  category: InsuranceCategory;
  level: ProtectionLevel;
  activePolicies: number;
  totalCoveredAmount: number;
  expiringWithin30Days: boolean;
  hasGaps: boolean;
  confidence: number;
}

export interface DashboardData {
  scores: ProtectionScore[];
  totalPolicies: number;
  activePolicies: number;
  expiringPolicies: number;
  coverageGaps: InsuranceCategory[];
}

export interface Alert {
  id: string;
  type: "expiring" | "gap" | "overlap" | "low_confidence" | "exclusion";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  relatedPolicyId?: string;
  category?: InsuranceCategory;
}

export interface SimulationResultSummary {
  totalClaimAmount: number;
  totalCovered: number;
  totalOutOfPocket: number;
  bestCaseOutOfPocket: number;
  worstCaseOutOfPocket: number;
  currency: string;
  policyResults: PolicySimulationResult[];
  warnings: string[];
  overallConfidence: ConfidenceLabel;
}

export interface PolicySimulationResult {
  policyId: string;
  policyNumber: string | null;
  insuranceCompany: string | null;
  category: InsuranceCategory;
  isApplicable: boolean;
  coveredAmount: number;
  deductibleAmount: number;
  copayAmount: number;
  outOfPocket: number;
  explanation: string;
  confidenceLevel: ConfidenceLabel;
  appliedConditions: string[];
  exclusionsFound: string[];
  uncertainties: string[];
  bestCase: number;
  worstCase: number;
}

export interface Citation {
  chunkId: string;
  documentId: string;
  documentName: string;
  text: string;
  page: number | null;
  section: string | null;
}
