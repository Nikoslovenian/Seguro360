import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  email: z.string().email("Email invalido"),
  password: z
    .string()
    .min(8, "La contrasena debe tener al menos 8 caracteres")
    .max(100)
    .regex(/[A-Z]/, "Debe contener al menos una mayuscula")
    .regex(/[0-9]/, "Debe contener al menos un numero"),
  confirmPassword: z.string(),
  rut: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contrasenas no coinciden",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
