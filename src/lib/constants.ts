export type InsuranceCategory =
  | "SALUD" | "VIDA" | "HOGAR" | "VEHICULO" | "ACCIDENTES"
  | "HOSPITALIZACION" | "INVALIDEZ" | "RESPONSABILIDAD_CIVIL" | "VIAJE" | "OTRO";

export const INSURANCE_CATEGORIES: Record<
  InsuranceCategory,
  { label: string; icon: string; description: string }
> = {
  SALUD: {
    label: "Salud",
    icon: "Heart",
    description: "Seguros de salud, complementarios e ISAPRE",
  },
  VIDA: {
    label: "Vida",
    icon: "Shield",
    description: "Seguros de vida individual y colectivo",
  },
  HOGAR: {
    label: "Hogar",
    icon: "Home",
    description: "Seguros de hogar, incendio, contenido",
  },
  VEHICULO: {
    label: "Vehiculo",
    icon: "Car",
    description: "Seguros automotriz, SOAP, todo riesgo",
  },
  ACCIDENTES: {
    label: "Accidentes Personales",
    icon: "AlertTriangle",
    description: "Seguros de accidentes personales",
  },
  HOSPITALIZACION: {
    label: "Hospitalizacion",
    icon: "Hospital",
    description: "Seguros de hospitalizacion y gastos clinicos",
  },
  INVALIDEZ: {
    label: "Invalidez / Fallecimiento",
    icon: "HeartPulse",
    description: "Seguros de invalidez, sobrevivencia, fallecimiento",
  },
  RESPONSABILIDAD_CIVIL: {
    label: "Responsabilidad Civil",
    icon: "Scale",
    description: "Seguros de responsabilidad civil y profesional",
  },
  VIAJE: {
    label: "Viaje",
    icon: "Plane",
    description: "Seguros de asistencia en viaje",
  },
  OTRO: {
    label: "Otros",
    icon: "MoreHorizontal",
    description: "Otros tipos de seguros",
  },
};

export const PROTECTION_LEVELS = {
  GREEN: { label: "Cobertura robusta", color: "text-green-600", bg: "bg-green-100" },
  YELLOW: { label: "Cobertura parcial", color: "text-yellow-600", bg: "bg-yellow-100" },
  RED: { label: "Sin cobertura", color: "text-red-600", bg: "bg-red-100" },
} as const;

export type ProtectionLevel = keyof typeof PROTECTION_LEVELS;

export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || "20") * 1024 * 1024;

export const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
];

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.85,
  MEDIUM: 0.6,
  LOW: 0.3,
} as const;
