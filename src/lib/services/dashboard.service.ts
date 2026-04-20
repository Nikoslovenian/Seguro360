import { prisma } from "@/lib/prisma";
import type { InsuranceCategory } from "@/types/prisma-enums";
import type { ProtectionLevel } from "@/lib/constants";
import type { ProtectionScore, Alert, DashboardData } from "@/types/insurance";

const ALL_CATEGORIES: InsuranceCategory[] = [
  "SALUD",
  "VIDA",
  "HOGAR",
  "VEHICULO",
  "ACCIDENTES",
  "HOSPITALIZACION",
  "INVALIDEZ",
  "RESPONSABILIDAD_CIVIL",
  "VIAJE",
  "OTRO",
];

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const DashboardService = {
  async getProtectionScores(userId: string): Promise<ProtectionScore[]> {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + THIRTY_DAYS_MS);

    const policies = await prisma.insurancePolicy.findMany({
      where: {
        userId,
        status: { in: ["ACTIVE", "PENDING_VERIFICATION"] },
      },
      select: {
        id: true,
        category: true,
        status: true,
        endDate: true,
        overallConfidence: true,
        totalInsuredAmount: true,
      },
    });

    const byCategory = new Map<InsuranceCategory, typeof policies>();
    for (const policy of policies) {
      const cat = policy.category as InsuranceCategory;
      const list = byCategory.get(cat) ?? [];
      list.push(policy);
      byCategory.set(cat, list);
    }

    return ALL_CATEGORIES.map((category) => {
      const categoryPolicies = byCategory.get(category) ?? [];
      const activePolicies = categoryPolicies.filter(
        (p) => p.endDate === null || p.endDate >= now,
      );

      if (activePolicies.length === 0) {
        return {
          category,
          level: "RED" as ProtectionLevel,
          activePolicies: 0,
          totalCoveredAmount: 0,
          expiringWithin30Days: false,
          hasGaps: true,
          confidence: 0,
        };
      }

      const expiringWithin30Days = activePolicies.some(
        (p) => p.endDate !== null && p.endDate <= thirtyDaysFromNow,
      );

      const avgConfidence =
        activePolicies.reduce(
          (sum, p) => sum + (p.overallConfidence ?? 0),
          0,
        ) / activePolicies.length;

      const totalCoveredAmount = activePolicies.reduce(
        (sum, p) =>
          sum + (p.totalInsuredAmount ? Number(p.totalInsuredAmount) : 0),
        0,
      );

      let level: ProtectionLevel;
      if (avgConfidence >= 0.7 && !expiringWithin30Days) {
        level = "GREEN";
      } else {
        level = "YELLOW";
      }

      return {
        category,
        level,
        activePolicies: activePolicies.length,
        totalCoveredAmount,
        expiringWithin30Days,
        hasGaps: false,
        confidence: Math.round(avgConfidence * 100) / 100,
      };
    });
  },

  async getAlerts(userId: string): Promise<Alert[]> {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + THIRTY_DAYS_MS);
    const alerts: Alert[] = [];

    const policies = await prisma.insurancePolicy.findMany({
      where: {
        userId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        policyNumber: true,
        insuranceCompany: true,
        category: true,
        endDate: true,
        overallConfidence: true,
      },
    });

    let alertIndex = 0;

    // Expiring policies
    for (const policy of policies) {
      if (
        policy.endDate &&
        policy.endDate >= now &&
        policy.endDate <= thirtyDaysFromNow
      ) {
        const daysLeft = Math.ceil(
          (policy.endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
        );
        const company = policy.insuranceCompany ?? "Poliza";
        const num = policy.policyNumber ?? "";
        const dateStr = policy.endDate.toLocaleDateString("es-CL");

        alerts.push({
          id: "expiring-" + alertIndex++,
          type: "expiring",
          severity: daysLeft <= 7 ? "high" : daysLeft <= 14 ? "medium" : "low",
          title: "Poliza por vencer en " + daysLeft + " dias",
          description:
            company + " " + num + " (" + policy.category + ") vence el " + dateStr + ".",
          relatedPolicyId: policy.id,
          category: policy.category as InsuranceCategory,
        });
      }
    }

    // Coverage gaps
    const coveredCategories = new Set(
      policies
        .filter((p) => p.endDate === null || p.endDate >= now)
        .map((p) => p.category),
    );

    const coreCategories: InsuranceCategory[] = [
      "SALUD",
      "VIDA",
      "HOGAR",
      "VEHICULO",
    ];

    for (const category of coreCategories) {
      if (!coveredCategories.has(category)) {
        const catLower = category.toLowerCase();
        alerts.push({
          id: "gap-" + alertIndex++,
          type: "gap",
          severity: "medium",
          title: "Sin cobertura de " + catLower,
          description:
            "No tiene una poliza activa de " +
            catLower +
            ". Considere contratar una para proteger esta area.",
          category,
        });
      }
    }

    // Overlapping policies
    const categoryCount = new Map<InsuranceCategory, number>();
    for (const policy of policies) {
      if (policy.endDate === null || policy.endDate >= now) {
        const cat = policy.category as InsuranceCategory;
        categoryCount.set(
          cat,
          (categoryCount.get(cat) ?? 0) + 1,
        );
      }
    }

    for (const [category, count] of categoryCount) {
      if (count > 1) {
        const catLower = category.toLowerCase();
        alerts.push({
          id: "overlap-" + alertIndex++,
          type: "overlap",
          severity: "low",
          title: "Posible sobreposicion en " + catLower,
          description:
            "Tiene " + count + " polizas activas de " + catLower +
            ". Revise si existe duplicidad de cobertura.",
          category,
        });
      }
    }

    // Low confidence
    for (const policy of policies) {
      if (
        policy.overallConfidence !== null &&
        policy.overallConfidence < 0.6
      ) {
        const company = policy.insuranceCompany ?? "una poliza";
        const num = policy.policyNumber ?? "";
        const pct = Math.round((policy.overallConfidence ?? 0) * 100);
        alerts.push({
          id: "confidence-" + alertIndex++,
          type: "low_confidence",
          severity: "medium",
          title: "Baja confianza en extraccion",
          description:
            "La informacion extraida de " + company + " " + num +
            " tiene baja confianza (" + pct + "%). Revise manualmente.",
          relatedPolicyId: policy.id,
          category: policy.category as InsuranceCategory,
        });
      }
    }

    const severityOrder = { high: 0, medium: 1, low: 2 };
    alerts.sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
    );

    return alerts;
  },

  async getDashboardData(userId: string): Promise<DashboardData> {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + THIRTY_DAYS_MS);

    const results = await Promise.allSettled([
      DashboardService.getProtectionScores(userId),
      DashboardService.getAlerts(userId),
      prisma.insurancePolicy.count({ where: { userId } }),
      prisma.insurancePolicy.count({
        where: {
          userId,
          status: "ACTIVE",
          OR: [{ endDate: null }, { endDate: { gte: now } }],
        },
      }),
      prisma.insurancePolicy.count({
        where: {
          userId,
          status: "ACTIVE",
          endDate: { gte: now, lte: thirtyDaysFromNow },
        },
      }),
    ]);

    const scores =
      results[0].status === "fulfilled" ? results[0].value : [];
    const alerts =
      results[1].status === "fulfilled" ? results[1].value : [];
    const totalPolicies =
      results[2].status === "fulfilled" ? results[2].value : 0;
    const activePolicies =
      results[3].status === "fulfilled" ? results[3].value : 0;
    const expiringPolicies =
      results[4].status === "fulfilled" ? results[4].value : 0;

    // Log any failures for ops visibility
    for (const [i, result] of results.entries()) {
      if (result.status === "rejected") {
        console.error(`[dashboard] Query ${i} failed:`, result.reason);
      }
    }

    const coverageGaps = scores
      .filter((s) => s.level === "RED")
      .map((s) => s.category);

    return {
      scores,
      totalPolicies,
      activePolicies,
      expiringPolicies,
      coverageGaps,
    };
  },
};
