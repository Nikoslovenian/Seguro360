import type { NextAuthConfig } from "next-auth";

const agentRoutes = ["/agent"];
const adminRoutes = ["/admin"];

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = (auth?.user as { role?: string } | undefined)?.role;
      const pathname = nextUrl.pathname;

      // --- API route protection ---

      // /api/auth/* is always allowed (NextAuth's own endpoints)
      if (pathname.startsWith("/api/auth")) {
        return true;
      }

      // /api/admin/* requires ADMIN role
      if (pathname.startsWith("/api/admin")) {
        if (!isLoggedIn) return false;
        if (role !== "ADMIN") {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }
        return true;
      }

      // /api/agent/* requires AGENT or ADMIN role
      if (pathname.startsWith("/api/agent")) {
        if (!isLoggedIn) return false;
        if (role !== "AGENT" && role !== "ADMIN") {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }
        return true;
      }

      // All other /api/* routes require authentication
      if (pathname.startsWith("/api")) {
        if (!isLoggedIn) return false;
        return true;
      }

      // --- Page route protection ---

      const isAgentRoute = agentRoutes.some((route) => pathname.startsWith(route));
      if (isAgentRoute) {
        if (!isLoggedIn) return false;
        if (role !== "AGENT" && role !== "ADMIN") {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
      if (isAdminRoute) {
        if (!isLoggedIn) return false;
        if (role !== "ADMIN") {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
      if (isAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      const isProtectedRoute =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/policies") ||
        pathname.startsWith("/documents") ||
        pathname.startsWith("/chat") ||
        pathname.startsWith("/simulate") ||
        pathname.startsWith("/library") ||
        pathname.startsWith("/profile") ||
        pathname.startsWith("/vulnerability") ||
        pathname.startsWith("/alerts") ||
        pathname.startsWith("/fine-print") ||
        pathname.startsWith("/onboarding");

      if (isProtectedRoute && !isLoggedIn) {
        return false;
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
