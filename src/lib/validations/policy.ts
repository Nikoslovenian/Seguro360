import { z } from "zod";

export const createPolicySchema = z.object({
  policyNumber: z.string().optional(),
  insuranceCompany: z.string().min(1, "La compania es requerida"),
  category: z.enum([
    "SALUD", "VIDA", "HOGAR", "VEHICULO", "ACCIDENTES",
    "HOSPITALIZACION", "INVALIDEZ", "RESPONSABILIDAD_CIVIL", "VIAJE", "OTRO",
  ]),
  ramo: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  premium: z.number().optional(),
  premiumCurrency: z.string().default("CLP"),
});

export const updatePolicySchema = createPolicySchema.partial();

export type CreatePolicyInput = z.infer<typeof createPolicySchema>;
export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;
