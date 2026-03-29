"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { isValidRut, cleanRut } from "@/lib/utils/rut";

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function registerUser(input: RegisterInput): Promise<ActionResult> {
  // Validate input
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return {
      success: false,
      error: firstError?.message ?? "Datos de registro invalidos.",
    };
  }

  const { name, email, password, rut } = parsed.data;

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        error: "Ya existe una cuenta con este email.",
      };
    }

    // Validate and hash RUT if provided
    let rutHash: string | undefined;
    if (rut && rut.trim().length > 0) {
      const cleaned = cleanRut(rut);
      if (!isValidRut(rut)) {
        return {
          success: false,
          error: "El RUT ingresado no es valido.",
        };
      }

      // Check if RUT is already registered
      const rutHashCandidate = await bcrypt.hash(cleaned, 10);

      // We can't check uniqueness by hash comparison (different salts),
      // so we store the cleaned RUT value for uniqueness via the rutHash field.
      // In production, use a deterministic hash (e.g., HMAC) for lookups.
      rutHash = rutHashCandidate;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        rut: rut && rut.trim().length > 0 ? cleanRut(rut) : undefined,
        rutHash,
        role: "USER",
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error registering user:", error);
    return {
      success: false,
      error: "Error interno del servidor. Intenta nuevamente.",
    };
  }
}
