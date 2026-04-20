import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";
import type { UserRole } from "@/types/prisma-enums";

export type AuthenticatedSession = Session & {
  user: {
    id: string;
    role: UserRole;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

/**
 * Validates that the request has an authenticated session.
 * Returns the session if valid, or a 401 NextResponse if not.
 */
export async function requireAuth(): Promise<
  AuthenticatedSession | NextResponse
> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "No autenticado" },
      { status: 401 },
    );
  }

  return session as AuthenticatedSession;
}

/**
 * Validates that the authenticated user has one of the allowed roles.
 * Returns the session if authorized, or a 401/403 NextResponse if not.
 */
export async function requireRole(
  ...allowedRoles: UserRole[]
): Promise<AuthenticatedSession | NextResponse> {
  const result = await requireAuth();

  if (result instanceof NextResponse) {
    return result;
  }

  const session = result;

  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json(
      { success: false, error: "No tiene permisos para realizar esta accion" },
      { status: 403 },
    );
  }

  return session;
}

/**
 * Type guard: returns true if the result is an authenticated session
 * (i.e. NOT an error response).
 */
export function isAuthenticated(
  result: AuthenticatedSession | NextResponse,
): result is AuthenticatedSession {
  return !(result instanceof NextResponse);
}
