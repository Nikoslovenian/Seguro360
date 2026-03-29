import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesion - CoverSight",
  description: "Inicia sesion en tu cuenta de CoverSight.",
};

export default function LoginPage() {
  return <LoginForm />;
}
