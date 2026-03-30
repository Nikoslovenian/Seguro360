import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Crear cuenta - Seguro 360",
  description: "Crea tu cuenta en Seguro 360 para gestionar tus seguros.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
