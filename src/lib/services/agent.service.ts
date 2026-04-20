import { prisma } from "@/lib/prisma";
import type { PaginatedResponse } from "@/types/api";
import type { AgentProfile, Prisma } from "@prisma/client";

export interface ClientFilters {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PortfolioSummary {
  totalClients: number;
  totalPolicies: number;
  activePolicies: number;
  expiringThisMonth: number;
  categorySummary: { category: string; count: number }[];
}

/** Fields to select for client list views (exclude sensitive data). */
const CLIENT_LIST_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  rut: true,
  phone: true,
  onboardingComplete: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

/** Fields for client detail view (includes policies). */
const CLIENT_DETAIL_SELECT = {
  ...CLIENT_LIST_SELECT,
  policies: {
    select: {
      id: true,
      policyNumber: true,
      insuranceCompany: true,
      category: true,
      ramo: true,
      startDate: true,
      endDate: true,
      premium: true,
      premiumCurrency: true,
      status: true,
      totalInsuredAmount: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" as const },
  },
} satisfies Prisma.UserSelect;

export const AgentService = {
  /**
   * Get the AgentProfile for a given user, including basic user info.
   */
  async getProfile(userId: string): Promise<AgentProfile | null> {
    return prisma.agentProfile.findUnique({
      where: { userId },
    });
  },

  /**
   * List clients assigned to this agent with optional search and pagination.
   */
  async listClients(
    agentProfileId: string,
    filters?: ClientFilters,
  ): Promise<PaginatedResponse<Prisma.UserGetPayload<{ select: typeof CLIENT_LIST_SELECT }>>> {
    const page = Math.max(1, filters?.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters?.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.UserWhereInput = {
      assignedAgentId: agentProfileId,
    };

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { email: { contains: filters.search } },
        { rut: { contains: filters.search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: CLIENT_LIST_SELECT,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  /**
   * Get detailed client info including their policies.
   * Verifies the client belongs to this agent.
   */
  async getClientDetail(
    agentProfileId: string,
    clientId: string,
  ): Promise<Prisma.UserGetPayload<{ select: typeof CLIENT_DETAIL_SELECT }> | null> {
    const client = await prisma.user.findFirst({
      where: {
        id: clientId,
        assignedAgentId: agentProfileId,
      },
      select: CLIENT_DETAIL_SELECT,
    });

    return client;
  },

  /**
   * Aggregate portfolio stats for an agent's clients.
   */
  async getPortfolioSummary(
    agentProfileId: string,
  ): Promise<PortfolioSummary> {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get all client IDs for this agent
    const clientIds = await prisma.user
      .findMany({
        where: { assignedAgentId: agentProfileId },
        select: { id: true },
      })
      .then((users) => users.map((u) => u.id));

    const totalClients = clientIds.length;

    if (totalClients === 0) {
      return {
        totalClients: 0,
        totalPolicies: 0,
        activePolicies: 0,
        expiringThisMonth: 0,
        categorySummary: [],
      };
    }

    const [totalPolicies, activePolicies, expiringThisMonth, policies] =
      await Promise.all([
        prisma.insurancePolicy.count({
          where: { userId: { in: clientIds } },
        }),
        prisma.insurancePolicy.count({
          where: {
            userId: { in: clientIds },
            status: "ACTIVE",
            OR: [{ endDate: null }, { endDate: { gte: now } }],
          },
        }),
        prisma.insurancePolicy.count({
          where: {
            userId: { in: clientIds },
            status: "ACTIVE",
            endDate: { gte: now, lte: endOfMonth },
          },
        }),
        prisma.insurancePolicy.findMany({
          where: {
            userId: { in: clientIds },
            status: "ACTIVE",
            OR: [{ endDate: null }, { endDate: { gte: now } }],
          },
          select: { category: true },
        }),
      ]);

    // Build category summary
    const categoryMap = new Map<string, number>();
    for (const policy of policies) {
      categoryMap.set(
        policy.category,
        (categoryMap.get(policy.category) ?? 0) + 1,
      );
    }

    const categorySummary = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalClients,
      totalPolicies,
      activePolicies,
      expiringThisMonth,
      categorySummary,
    };
  },
};
