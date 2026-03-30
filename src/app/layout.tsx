import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import { AuthSessionProvider } from "@/providers/session-provider";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Seguro 360 - Analisis de Seguros",
  description:
    "Plataforma integral para consolidar, analizar y comprender tus polizas de seguros. Gestion inteligente de seguros en Chile.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CL" className={cn("h-full", "antialiased", inter.variable, "font-sans", geist.variable)}>
      <body className="min-h-full flex flex-col font-sans">
        <AuthSessionProvider>
          <QueryProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </QueryProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
