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
        pathname.startsWith("/profile");

      if (isProtectedRoute && !isLoggedIn) {
        return false;
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
