import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthenticated } from "@/server/middleware/auth-guard";
import { LibraryService } from "@/lib/services/library.service";
import type { ApiResponse } from "@/types/api";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!isAuthenticated(authResult)) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") ?? undefined;
    const company = searchParams.get("company") ?? undefined;
    const search = searchParams.get("search") ?? undefined;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);

    const result = await LibraryService.list({
      category,
      company,
      search,
      page,
      pageSize,
    });

    return NextResponse.json<ApiResponse>({ success: true, data: result });
  } catch (error) {
    console.error("[GET /api/library]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al obtener biblioteca de polizas" },
      { status: 500 },
    );
  }
}
