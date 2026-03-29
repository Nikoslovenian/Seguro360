import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Crear cuenta - CoverSight",
  description: "Crea tu cuenta en CoverSight para gestionar tus seguros.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
