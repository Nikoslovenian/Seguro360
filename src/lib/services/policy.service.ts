import { prisma } from "@/lib/prisma";
import type {
  InsuranceCategory,
  InsurancePolicy,
  PolicyStatus,
  Prisma,
} from "@prisma/client";
import type { PaginatedResponse } from "@/types/api";
import type { CreatePolicyInput, UpdatePolicyInput } from "@/lib/validations/policy";

export interface PolicyFilters {
  category?: InsuranceCategory;
  status?: PolicyStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

/** Relations included in a full policy detail response. */
const POLICY_FULL_INCLUDE = {
  coverages: true,
  exclusions: true,
  deductibles: true,
  benefitLimits: true,
  waitingPeriods: true,
  beneficiaries: true,
  sourceDocument: {
    select: {
      id: true,
      fileName: true,
      fileType: true,
      processingStatus: true,
    },
  },
} as const;

/** Lighter include for list views. */
const POLICY_LIST_INCLUDE = {
  coverages: {
    select: { id: true, name: true, coveredAmount: true },
    take: 5,
  },
  sourceDocument: {
    select: { id: true, fileName: true },
  },
} as const;

export type PolicyWithRelations = Prisma.InsurancePolicyGetPayload<{
  include: typeof POLICY_FULL_INCLUDE;
}>;

export const PolicyService = {
  /**
   * Find a single policy by ID with ownership check and all relations.
   */
  async findById(
    id: string,
    userId: string,
  ): Promise<PolicyWithRelations | null> {
    const policy = await prisma.insurancePolicy.findUnique({
      where: { id },
      include: POLICY_FULL_INCLUDE,
    });

    if (!policy || policy.userId !== userId) {
      return null;
    }

    return policy;
  },

  /**
   * List policies for a user with optional filters and pagination.
   */
  async listByUser(
    userId: string,
    filters?: PolicyFilters,
  ): Promise<PaginatedResponse<InsurancePolicy>> {
    const page = Math.max(1, filters?.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters?.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.InsurancePolicyWhereInput = { userId };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { policyNumber: { contains: filters.search, mode: "insensitive" } },
        {
          insuranceCompany: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
        { insuredName: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.insurancePolicy.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: POLICY_LIST_INCLUDE,
      }),
      prisma.insurancePolicy.count({ where }),
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
   * Create a policy from validated input.
   */
  async create(
    userId: string,
    data: CreatePolicyInput,
  ): Promise<InsurancePolicy> {
    return prisma.insurancePolicy.create({
      data: {
        userId,
        policyNumber: data.policyNumber,
        insuranceCompany: data.insuranceCompany,
        category: data.category,
        ramo: data.ramo,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        premium: data.premium,
        premiumCurrency: data.premiumCurrency ?? "CLP",
        status: "ACTIVE",
        source: "MANUAL_ENTRY",
      },
    });
  },

  /**
   * Partial update of policy fields. Validates ownership.
   */
  async update(
    id: string,
    userId: string,
    data: UpdatePolicyInput,
  ): Promise<InsurancePolicy | null> {
    const existing = await prisma.insurancePolicy.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing || existing.userId !== userId) {
      return null;
    }

    const updateData: Prisma.InsurancePolicyUpdateInput = {};

    if (data.policyNumber !== undefined)
      updateData.policyNumber = data.policyNumber;
    if (data.insuranceCompany !== undefined)
      updateData.insuranceCompany = data.insuranceCompany;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.ramo !== undefined) updateData.ramo = data.ramo;
    if (data.startDate !== undefined)
      updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined)
      updateData.endDate = new Date(data.endDate);
    if (data.premium !== undefined) updateData.premium = data.premium;
    if (data.premiumCurrency !== undefined)
      updateData.premiumCurrency = data.premiumCurrency;

    return prisma.insurancePolicy.update({
      where: { id },
      data: updateData,
    });
  },

  /**
   * Get all policies for a specific insurance category.
   */
  async getByCategory(
    userId: string,
    category: InsuranceCategory,
  ): Promise<InsurancePolicy[]> {
    return prisma.insurancePolicy.findMany({
      where: { userId, category },
      orderBy: { createdAt: "desc" },
      include: POLICY_LIST_INCLUDE,
    });
  },

  /**
   * Get all active (non-expired) policies for a user.
   */
  async getActivePolicies(userId: string): Promise<InsurancePolicy[]> {
    const now = new Date();

    return prisma.insurancePolicy.findMany({
      where: {
        userId,
        status: "ACTIVE",
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      orderBy: { endDate: "asc" },
      include: POLICY_LIST_INCLUDE,
    });
  },
};
