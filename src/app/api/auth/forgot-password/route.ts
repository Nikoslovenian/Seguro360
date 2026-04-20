import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import type { ApiResponse } from "@/types/api";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalido"),
});

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Cuerpo de solicitud invalido" },
      { status: 400 },
    );
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: parsed.error.issues[0]?.message ?? "Email invalido" },
      { status: 400 },
    );
  }

  try {
    const { email } = parsed.data;

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    if (user) {
      // Generate a reset token
      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store token in VerificationToken table (reusing NextAuth's model)
      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires,
        },
      });

      // In production, send email here with:
      // const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}&email=${email}`;
      // await sendEmail(email, resetUrl);

      console.log(
        `[forgot-password] Reset token generated for ${email}: ${token} (expires: ${expires.toISOString()})`,
      );
    }

    // Always return success (security: don't reveal if email exists)
    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Si el email existe, se enviara un enlace de recuperacion.",
    });
  } catch (error) {
    console.error("[POST /api/auth/forgot-password]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error al procesar la solicitud" },
      { status: 500 },
    );
  }
}
