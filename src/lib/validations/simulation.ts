import { z } from "zod";

export const simulationSchema = z.object({
  eventType: z.enum([
    "HOSPITALIZATION",
    "MEDICAL_CONSULTATION",
    "SURGERY",
    "ACCIDENT",
    "VEHICLE_ACCIDENT",
    "VEHICLE_THEFT",
    "PROPERTY_DAMAGE",
    "NATURAL_DISASTER",
    "DEATH",
    "DISABILITY",
    "TRAVEL_EMERGENCY",
    "LIABILITY_CLAIM",
    "OTHER",
  ]),
  eventDescription: z.string().min(10, "Describa el evento con mas detalle").max(2000),
  claimAmount: z.number().positive("El monto debe ser positivo"),
  currency: z.string().default("CLP"),
  eventDate: z.string().datetime().optional(),
});

export type SimulationInput = z.infer<typeof simulationSchema>;
