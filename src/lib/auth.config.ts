import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@prisma/client";

const agentRoutes = ["/agent"];
const adminRoutes = ["/admin"];

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = (auth?.user as { role?: UserRole } | undefined)?.role;
      const pathname = nextUrl.pathname;

      // Protect agent routes: require AGENT or ADMIN role
      const isAgentRoute = agentRoutes.some((route) =>
        pathname.startsWith(route)
      );
      if (isAgentRoute) {
        if (!isLoggedIn) return false;
        if (role !== "AGENT" && role !== "ADMIN") {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      // Protect admin routes: require ADMIN role
      const isAdminRoute = adminRoutes.some((route) =>
        pathname.startsWith(route)
      );
      if (isAdminRoute) {
        if (!isLoggedIn) return false;
        if (role !== "ADMIN") {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      // Auth pages: redirect logged-in users to dashboard
      const isAuthPage =
        pathname.startsWith("/login") || pathname.startsWith("/register");
      if (isAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      // Dashboard and other protected routes
      const isProtectedRoute =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/policies") ||
        pathname.startsWith("/documents") ||
        pathname.startsWith("/chat") ||
        pathname.startsWith("/simulate") ||
        pathname.startsWith("/library") ||
        pathname.startsWith("/profile");

      if (isProtectedRoute && !isLoggedIn) {
        return false;
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
