import { prisma } from "@/lib/prisma";
import { detectGESPathology } from "@/lib/ges-auge";
import type { SimulationInput } from "@/lib/validations/simulation";
import type { InsuranceCategory, ConfidenceLabel } from "@/types/prisma-enums";
import type { PaginatedResponse } from "@/types/api";
import type {
  SimulationResultSummary,
  PolicySimulationResult,
} from "@/types/insurance";
import type { Prisma } from "@prisma/client";

// ─── Event type to insurance category mapping ──────────────────────────────

const EVENT_CATEGORY_MAP: Record<string, InsuranceCategory[]> = {
  HOSPITALIZATION: ["SALUD", "HOSPITALIZACION"],
  MEDICAL_CONSULTATION: ["SALUD"],
  SURGERY: ["SALUD", "HOSPITALIZACION"],
  ACCIDENT: ["SALUD", "ACCIDENTES"],
  VEHICLE_ACCIDENT: ["VEHICULO"],
  VEHICLE_THEFT: ["VEHICULO"],
  PROPERTY_DAMAGE: ["HOGAR"],
  NATURAL_DISASTER: ["HOGAR"],
  DEATH: ["VIDA", "INVALIDEZ"],
  DISABILITY: ["VIDA", "INVALIDEZ"],
  TRAVEL_EMERGENCY: ["VIAJE"],
  LIABILITY_CLAIM: ["RESPONSABILIDAD_CIVIL"],
  OTHER: [],
};

// ─── Full include for simulation queries ────────────────────────────────────

const SIMULATION_POLICY_INCLUDE = {
  coverages: true,
  exclusions: true,
  deductibles: true,
  benefitLimits: true,
} as const;

type PolicyForSimulation = Prisma.InsurancePolicyGetPayload<{
  include: typeof SIMULATION_POLICY_INCLUDE;
}>;

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCLP(amount: number): string {
  return `$${Math.round(amount).toLocaleString("es-CL")}`;
}

function matchesExclusion(description: string, exclusionDesc: string): boolean {
  const descLower = description.toLowerCase();
  // Split exclusion text into keywords (3+ chars) and check overlap
  const keywords = exclusionDesc
    .toLowerCase()
    .split(/[\s,;.()]+/)
    .filter((w) => w.length >= 3);

  if (keywords.length === 0) return false;

  const matched = keywords.filter((kw) => descLower.includes(kw));
  // Require at least 2 keyword matches, or 1 if the exclusion is short
  const threshold = keywords.length <= 2 ? 1 : 2;
  return matched.length >= threshold;
}

function determineConfidence(
  policy: PolicyForSimulation,
  exclusionsFound: string[],
): ConfidenceLabel {
  // Lower confidence when there's missing data or ambiguous exclusions
  if (!policy.coverages.length) return "LOW";
  if (exclusionsFound.length > 0) return "MEDIUM";
  if (
    policy.overallConfidence !== null &&
    policy.overallConfidence !== undefined &&
    policy.overallConfidence < 0.6
  )
    return "LOW";
  if (
    policy.overallConfidence !== null &&
    policy.overallConfidence !== undefined &&
    policy.overallConfidence < 0.85
  )
    return "MEDIUM";
  return "HIGH";
}

// ─── Core simulation logic per policy ───────────────────────────────────────

function simulateForPolicy(
  policy: PolicyForSimulation,
  input: SimulationInput,
): PolicySimulationResult {
  const appliedConditions: string[] = [];
  const exclusionsFound: string[] = [];
  const uncertainties: string[] = [];

  // 1. Check exclusions
  const matchedExclusions: Array<{ description: string; isAbsolute: boolean }> = [];
  for (const exclusion of policy.exclusions) {
    if (matchesExclusion(input.eventDescription, exclusion.description)) {
      exclusionsFound.push(exclusion.description);
      matchedExclusions.push({
        description: exclusion.description,
        isAbsolute: exclusion.isAbsolute,
      });
    }
  }

  const isExcluded = matchedExclusions.some((e) => e.isAbsolute);

  if (isExcluded) {
    const explanation =
      `La poliza ${policy.policyNumber ?? policy.id} de ${policy.insuranceCompany ?? "aseguradora"} ` +
      `no cubre este evento. Se encontraron exclusiones aplicables: ${exclusionsFound.join("; ")}.`;

    return {
      policyId: policy.id,
      policyNumber: policy.policyNumber,
      insuranceCompany: policy.insuranceCompany,
      category: policy.category as InsuranceCategory,
      isApplicable: false,
      coveredAmount: 0,
      deductibleAmount: 0,
      copayAmount: 0,
      outOfPocket: input.claimAmount,
      explanation,
      confidenceLevel: "HIGH",
      appliedConditions: ["Exclusion aplicable encontrada"],
      exclusionsFound,
      uncertainties,
      bestCase: input.claimAmount,
      worstCase: input.claimAmount,
    };
  }

  if (exclusionsFound.length > 0) {
    uncertainties.push(
      `Se detectaron exclusiones parciales (no absolutas): ${exclusionsFound.join("; ")}. ` +
        "La cobertura podria verse reducida.",
    );
  }

  // 2. Sum relevant coverage limits
  let totalCoverageLimit = 0;
  const applicableCoverages: string[] = [];

  for (const coverage of policy.coverages) {
    const limit =
      coverage.limitPerEvent ?? coverage.coveredAmount ?? coverage.limitAnnual ?? 0;
    totalCoverageLimit += limit;
    applicableCoverages.push(
      `${coverage.name}: ${formatCLP(limit)}`,
    );
  }

  // If policy has totalInsuredAmount but no individual coverages, use that
  if (totalCoverageLimit === 0 && policy.totalInsuredAmount) {
    totalCoverageLimit = policy.totalInsuredAmount;
    applicableCoverages.push(
      `Suma asegurada total: ${formatCLP(totalCoverageLimit)}`,
    );
  }

  if (totalCoverageLimit === 0) {
    uncertainties.push(
      "No se encontraron limites de cobertura especificos en la poliza. " +
        "El calculo es estimativo.",
    );
    // Assume full coverage up to claim amount as a generous estimate
    totalCoverageLimit = input.claimAmount;
  }

  appliedConditions.push(
    `Coberturas aplicables: ${applicableCoverages.join(", ")}`,
  );

  // 3. Apply deductible
  let deductibleAmount = 0;
  for (const deductible of policy.deductibles) {
    if (deductible.amount) {
      deductibleAmount += deductible.amount;
      appliedConditions.push(
        `Deducible "${deductible.name}": ${formatCLP(deductible.amount)}`,
      );
    } else if (deductible.percentage) {
      const deductAmt = input.claimAmount * (deductible.percentage / 100);
      deductibleAmount += deductAmt;
      appliedConditions.push(
        `Deducible "${deductible.name}": ${deductible.percentage}% = ${formatCLP(deductAmt)}`,
      );
    }
  }

  // 4. Calculate covered amount
  const coveredAmount = Math.max(
    0,
    Math.min(input.claimAmount, totalCoverageLimit) - deductibleAmount,
  );

  // 5. Apply copay from benefit limits (or default 20%)
  let copayPercent = 20; // default
  const copayLimit = policy.benefitLimits.find(
    (bl) => bl.limitType === "COPAY" && bl.percentage !== null,
  );
  if (copayLimit?.percentage !== null && copayLimit?.percentage !== undefined) {
    copayPercent = copayLimit.percentage;
    appliedConditions.push(
      `Copago segun poliza: ${copayPercent}%`,
    );
  } else {
    appliedConditions.push(`Copago estimado (por defecto): ${copayPercent}%`);
  }

  const copayAmount = coveredAmount * (copayPercent / 100);

  // 6. Calculate out of pocket
  const outOfPocket =
    input.claimAmount - coveredAmount + copayAmount + deductibleAmount;

  // 7. Confidence
  const confidenceLevel = determineConfidence(policy, exclusionsFound);

  // 8. Best/worst case (+-15% range)
  const varianceFactor = confidenceLevel === "HIGH" ? 0.05 : confidenceLevel === "MEDIUM" ? 0.15 : 0.25;
  const bestCase = Math.max(0, outOfPocket * (1 - varianceFactor));
  const worstCase = Math.min(input.claimAmount, outOfPocket * (1 + varianceFactor));

  // 9. Build explanation in Spanish
  const explanationParts: string[] = [
    `Poliza ${policy.policyNumber ?? policy.id} (${policy.insuranceCompany ?? "aseguradora"}) - Categoria: ${policy.category}.`,
    `Monto reclamado: ${formatCLP(input.claimAmount)}.`,
    `Limite de cobertura total: ${formatCLP(totalCoverageLimit)}.`,
  ];

  if (deductibleAmount > 0) {
    explanationParts.push(`Deducible aplicado: ${formatCLP(deductibleAmount)}.`);
  }

  explanationParts.push(
    `Monto cubierto (despues de deducible): ${formatCLP(coveredAmount)}.`,
    `Copago (${copayPercent}%): ${formatCLP(copayAmount)}.`,
    `Gasto de bolsillo estimado: ${formatCLP(outOfPocket)}.`,
  );

  if (uncertainties.length > 0) {
    explanationParts.push(`Nota: ${uncertainties.join(" ")}`);
  }

  // GES/AUGE detection
  const gesMatch = detectGESPathology(input.eventDescription);
  if (gesMatch) {
    explanationParts.push(
      `Patologia GES detectada: "${gesMatch.name}". ` +
        `Esta condicion tiene garantias GES/AUGE que podrian reducir su copago segun su sistema de salud (FONASA/ISAPRE).`,
    );
    appliedConditions.push(`Patologia GES: ${gesMatch.name}`);
  }

  return {
    policyId: policy.id,
    policyNumber: policy.policyNumber,
    insuranceCompany: policy.insuranceCompany,
    category: policy.category as InsuranceCategory,
    isApplicable: true,
    coveredAmount,
    deductibleAmount,
    copayAmount,
    outOfPocket,
    explanation: explanationParts.join(" "),
    confidenceLevel,
    appliedConditions,
    exclusionsFound,
    uncertainties,
    bestCase,
    worstCase,
  };
}

// ─── Scenario include for list / getById ────────────────────────────────────

const SCENARIO_INCLUDE = {
  results: {
    include: {
      policy: {
        select: {
          id: true,
          policyNumber: true,
          insuranceCompany: true,
          category: true,
        },
      },
    },
  },
} as const;

// ─── Service ────────────────────────────────────────────────────────────────

export const SimulationService = {
  /**
   * Run a simulation for a user against all their active policies.
   */
  async simulate(
    userId: string,
    input: SimulationInput,
  ): Promise<{
    scenario: { id: string; createdAt: Date };
    summary: SimulationResultSummary;
  }> {
    // 1. Fetch active policies with full relations
    const policies = await prisma.insurancePolicy.findMany({
      where: {
        userId,
        status: "ACTIVE",
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
      include: SIMULATION_POLICY_INCLUDE,
    });

    if (policies.length === 0) {
      // Create scenario with no results
      const scenario = await prisma.simulationScenario.create({
        data: {
          userId,
          eventType: input.eventType,
          eventDescription: input.eventDescription,
          claimAmount: input.claimAmount,
          currency: input.currency ?? "CLP",
          eventDate: input.eventDate ? new Date(input.eventDate) : undefined,
        },
      });

      return {
        scenario: { id: scenario.id, createdAt: scenario.createdAt },
        summary: {
          totalClaimAmount: input.claimAmount,
          totalCovered: 0,
          totalOutOfPocket: input.claimAmount,
          bestCaseOutOfPocket: input.claimAmount,
          worstCaseOutOfPocket: input.claimAmount,
          currency: input.currency ?? "CLP",
          policyResults: [],
          warnings: [
            "No se encontraron polizas activas. Suba sus documentos de seguro para obtener una simulacion completa.",
          ],
          overallConfidence: "LOW",
        },
      };
    }

    // 2. Filter policies by matching categories
    const targetCategories = EVENT_CATEGORY_MAP[input.eventType] ?? [];
    const applicablePolicies =
      targetCategories.length > 0
        ? policies.filter((p) =>
            targetCategories.includes(p.category as InsuranceCategory),
          )
        : policies; // For OTHER, try all policies

    // 3. Simulate each applicable policy
    const policyResults: PolicySimulationResult[] = applicablePolicies.map(
      (policy) => simulateForPolicy(policy, input),
    );

    // Also mark non-applicable policies
    const nonApplicablePolicies = policies.filter(
      (p) => !applicablePolicies.includes(p),
    );
    for (const policy of nonApplicablePolicies) {
      policyResults.push({
        policyId: policy.id,
        policyNumber: policy.policyNumber,
        insuranceCompany: policy.insuranceCompany,
        category: policy.category as InsuranceCategory,
        isApplicable: false,
        coveredAmount: 0,
        deductibleAmount: 0,
        copayAmount: 0,
        outOfPocket: input.claimAmount,
        explanation:
          `La poliza ${policy.policyNumber ?? policy.id} es de categoria "${policy.category}" ` +
          `y no aplica para eventos de tipo "${input.eventType}".`,
        confidenceLevel: "HIGH",
        appliedConditions: [],
        exclusionsFound: [],
        uncertainties: [],
        bestCase: input.claimAmount,
        worstCase: input.claimAmount,
      });
    }

    // 4. Build summary from applicable results
    const applicableResults = policyResults.filter((r) => r.isApplicable);

    // Use the best single policy result (lowest out of pocket)
    const bestResult = applicableResults.length > 0
      ? applicableResults.reduce((best, r) =>
          r.outOfPocket < best.outOfPocket ? r : best,
        )
      : null;

    const totalCovered = bestResult?.coveredAmount ?? 0;
    const totalOutOfPocket = bestResult?.outOfPocket ?? input.claimAmount;
    const bestCaseOOP = bestResult?.bestCase ?? input.claimAmount;
    const worstCaseOOP = bestResult?.worstCase ?? input.claimAmount;

    const warnings: string[] = [];
    if (applicableResults.length === 0) {
      warnings.push(
        `Ninguna de sus ${policies.length} polizas activas cubre eventos de tipo "${input.eventType}".`,
      );
    }
    if (applicableResults.length > 1) {
      warnings.push(
        `Se encontraron ${applicableResults.length} polizas aplicables. Se muestra el mejor escenario. ` +
          "Verifique las condiciones de cada poliza individualmente.",
      );
    }

    const gesMatch = detectGESPathology(input.eventDescription);
    if (gesMatch) {
      warnings.push(
        `Patologia GES/AUGE detectada: "${gesMatch.name}". Tiene garantias de cobertura reguladas por ley.`,
      );
    }

    const overallConfidence: ConfidenceLabel =
      applicableResults.length === 0
        ? "LOW"
        : applicableResults.every((r) => r.confidenceLevel === "HIGH")
          ? "HIGH"
          : applicableResults.some((r) => r.confidenceLevel === "LOW")
            ? "LOW"
            : "MEDIUM";

    const summary: SimulationResultSummary = {
      totalClaimAmount: input.claimAmount,
      totalCovered,
      totalOutOfPocket,
      bestCaseOutOfPocket: bestCaseOOP,
      worstCaseOutOfPocket: worstCaseOOP,
      currency: input.currency ?? "CLP",
      policyResults,
      warnings,
      overallConfidence,
    };

    // 5. Save to DB in a transaction
    const scenario = await prisma.simulationScenario.create({
      data: {
        userId,
        eventType: input.eventType,
        eventDescription: input.eventDescription,
        claimAmount: input.claimAmount,
        currency: input.currency ?? "CLP",
        eventDate: input.eventDate ? new Date(input.eventDate) : undefined,
        results: {
          create: policyResults.map((r) => ({
            policyId: r.policyId,
            isApplicable: r.isApplicable,
            coveredAmount: r.coveredAmount,
            deductibleAmount: r.deductibleAmount,
            copayAmount: r.copayAmount,
            outOfPocket: r.outOfPocket,
            currency: input.currency ?? "CLP",
            explanation: r.explanation,
            appliedRules: JSON.stringify(r.appliedConditions),
            uncertainties: JSON.stringify(r.uncertainties),
            confidenceLevel: r.confidenceLevel,
            bestCase: r.bestCase,
            worstCase: r.worstCase,
          })),
        },
      },
    });

    return {
      scenario: { id: scenario.id, createdAt: scenario.createdAt },
      summary,
    };
  },

  /**
   * List past simulation scenarios for a user with pagination.
   */
  async listByUser(
    userId: string,
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedResponse<unknown>> {
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(100, Math.max(1, pageSize));
    const skip = (safePage - 1) * safePageSize;

    const [items, total] = await Promise.all([
      prisma.simulationScenario.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: safePageSize,
        include: SCENARIO_INCLUDE,
      }),
      prisma.simulationScenario.count({ where: { userId } }),
    ]);

    return {
      items,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize),
    };
  },

  /**
   * Get a single simulation scenario with results. Validates ownership.
   */
  async getById(
    scenarioId: string,
    userId: string,
  ) {
    const scenario = await prisma.simulationScenario.findUnique({
      where: { id: scenarioId },
      include: SCENARIO_INCLUDE,
    });

    if (!scenario || scenario.userId !== userId) {
      return null;
    }

    return scenario;
  },
};
