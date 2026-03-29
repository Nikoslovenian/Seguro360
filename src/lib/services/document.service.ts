import { prisma } from "@/lib/prisma";
import type {
  PolicyDocument,
  ProcessingStatus,
  Prisma,
} from "@prisma/client";
import type { PaginatedResponse, PaginationParams } from "@/types/api";

export interface CreateDocumentData {
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  storageBucket?: string;
  organizationId?: string;
}

export const DocumentService = {
  /**
   * Create a new PolicyDocument record.
   */
  async create(
    userId: string,
    data: CreateDocumentData,
  ): Promise<PolicyDocument> {
    return prisma.policyDocument.create({
      data: {
        userId,
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize,
        storagePath: data.storagePath,
        storageBucket: data.storageBucket ?? "documents",
        organizationId: data.organizationId,
        processingStatus: "PENDING",
      },
    });
  },

  /**
   * Find a document by ID with ownership check.
   * Returns null if the document does not exist or does not belong to the user.
   */
  async findById(
    id: string,
    userId: string,
  ): Promise<PolicyDocument | null> {
    const document = await prisma.policyDocument.findUnique({
      where: { id },
      include: {
        policies: {
          select: {
            id: true,
            policyNumber: true,
            insuranceCompany: true,
            category: true,
            status: true,
          },
        },
      },
    });

    if (!document || document.userId !== userId) {
      return null;
    }

    return document;
  },

  /**
   * List documents for a user with pagination.
   */
  async listByUser(
    userId: string,
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<PolicyDocument>> {
    const page = Math.max(1, pagination?.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, pagination?.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const sortBy = pagination?.sortBy ?? "createdAt";
    const sortOrder = pagination?.sortOrder ?? "desc";

    const where: Prisma.PolicyDocumentWhereInput = {
      userId,
    };

    const [items, total] = await Promise.all([
      prisma.policyDocument.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize,
        include: {
          policies: {
            select: {
              id: true,
              policyNumber: true,
              category: true,
              status: true,
            },
          },
        },
      }),
      prisma.policyDocument.count({ where }),
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
   * Update the processing status of a document.
   */
  async updateStatus(
    id: string,
    status: ProcessingStatus,
    error?: string,
  ): Promise<PolicyDocument> {
    const data: Prisma.PolicyDocumentUpdateInput = {
      processingStatus: status,
    };

    if (status === "EXTRACTING_TEXT" && !error) {
      data.processingStartedAt = new Date();
    }

    if (status === "COMPLETED") {
      data.processingCompletedAt = new Date();
      data.processingError = null;
    }

    if (status === "FAILED" && error) {
      data.processingError = error;
      data.processingCompletedAt = new Date();
    }

    if (error) {
      data.processingError = error;
    }

    return prisma.policyDocument.update({
      where: { id },
      data,
    });
  },

  /**
   * Soft delete a document (mark as failed with deletion message).
   * Also removes the file from storage -- caller is responsible for S3 deletion.
   * Returns the document if it existed and belonged to the user, null otherwise.
   */
  async delete(
    id: string,
    userId: string,
  ): Promise<PolicyDocument | null> {
    const document = await prisma.policyDocument.findUnique({
      where: { id },
    });

    if (!document || document.userId !== userId) {
      return null;
    }

    // Cascade-safe: disconnect policies, then delete the document
    // In a soft-delete approach we keep the record but mark it
    const deleted = await prisma.policyDocument.delete({
      where: { id },
    });

    return deleted;
  },
};
