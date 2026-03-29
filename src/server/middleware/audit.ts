import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export interface LogAuditParams {
  userId: string | null;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  request?: NextRequest | Request;
}

/**
 * Creates an audit log entry in the database.
 * Extracts IP address and User-Agent from the request when provided.
 * This function never throws -- audit failures are logged but do not
 * break the calling request.
 */
export async function logAudit(params: LogAuditParams): Promise<void> {
  const { userId, action, resource, resourceId, details, request } = params;

  let ipAddress: string | null = null;
  let userAgent: string | null = null;

  if (request) {
    // Next.js forwards the client IP in x-forwarded-for or x-real-ip
    const headers =
      request instanceof Request ? request.headers : request.headers;
    ipAddress =
      headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headers.get("x-real-ip") ??
      null;
    userAgent = headers.get("user-agent") ?? null;
  }

  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        details: details ?? undefined,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Audit logging should never cause request failures.
    // Log to stderr for ops visibility.
    console.error("[audit] Failed to write audit log:", error);
  }
}
