import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/api";

/**
 * Safely parse JSON from a Request. Returns [data, null] on success,
 * or [null, errorResponse] on failure (malformed JSON).
 */
export async function safeParseJson<T = unknown>(
  request: Request,
): Promise<[T, null] | [null, NextResponse]> {
  try {
    const body = await request.json();
    return [body as T, null];
  } catch {
    return [
      null,
      NextResponse.json<ApiResponse>(
        { success: false, error: "Cuerpo de solicitud invalido" },
        { status: 400 },
      ),
    ];
  }
}
