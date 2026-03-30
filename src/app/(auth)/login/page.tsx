import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesion - Seguro 360",
  description: "Inicia sesion en tu cuenta de Seguro 360.",
};

export default function LoginPage() {
  return <LoginForm />;
}
