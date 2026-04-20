import { prisma } from "@/lib/prisma";
import type { PaginatedResponse } from "@/types/api";
import type { PolicyLibraryEntry, Prisma } from "@prisma/client";

export interface LibraryFilters {
  category?: string;
  company?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export const LibraryService = {
  /**
   * List active library entries with optional filters and pagination.
   */
  async list(
    filters?: LibraryFilters,
  ): Promise<PaginatedResponse<PolicyLibraryEntry>> {
    const page = Math.max(1, filters?.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters?.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.PolicyLibraryEntryWhereInput = { isActive: true };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.company) {
      where.insuranceCompany = { contains: filters.company };
    }

    if (filters?.search) {
      where.OR = [
        { productName: { contains: filters.search } },
        { insuranceCompany: { contains: filters.search } },
        { summary: { contains: filters.search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.policyLibraryEntry.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.policyLibraryEntry.count({ where }),
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
   * Find a single active library entry by ID.
   */
  async findById(id: string): Promise<PolicyLibraryEntry | null> {
    return prisma.policyLibraryEntry.findFirst({
      where: { id, isActive: true },
    });
  },
};
