import { prisma } from "@/lib/prisma";
import type { ConsentRecord } from "@prisma/client";
import type { ConsentType } from "@/types/prisma-enums";

export const ConsentService = {
  /**
   * Grant a consent for a user. Creates a new record.
   * If the user already granted this consent type, the previous one is revoked first.
   */
  async grantConsent(
    userId: string,
    consentType: ConsentType,
    version: string,
    ipAddress?: string | null,
    userAgent?: string | null,
  ): Promise<ConsentRecord> {
    // Revoke any previously active consent of the same type
    await prisma.consentRecord.updateMany({
      where: {
        userId,
        consentType,
        granted: true,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return prisma.consentRecord.create({
      data: {
        userId,
        consentType,
        granted: true,
        version,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });
  },

  /**
   * Revoke a specific consent type for a user.
   */
  async revokeConsent(
    userId: string,
    consentType: ConsentType,
  ): Promise<void> {
    await prisma.consentRecord.updateMany({
      where: {
        userId,
        consentType,
        granted: true,
        revokedAt: null,
      },
      data: {
        granted: false,
        revokedAt: new Date(),
      },
    });
  },

  /**
   * Check if a user currently has an active (granted and not revoked) consent.
   */
  async hasConsent(
    userId: string,
    consentType: ConsentType,
  ): Promise<boolean> {
    const record = await prisma.consentRecord.findFirst({
      where: {
        userId,
        consentType,
        granted: true,
        revokedAt: null,
      },
      select: { id: true },
    });
    return record !== null;
  },

  /**
   * List all consent records for a user (both active and revoked).
   */
  async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    return prisma.consentRecord.findMany({
      where: { userId },
      orderBy: { grantedAt: "desc" },
    });
  },
};
