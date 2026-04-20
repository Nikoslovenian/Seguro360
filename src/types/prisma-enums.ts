/**
 * Local type definitions for values stored as plain strings in the Prisma schema.
 * The schema uses String (not enum) for these fields, so @prisma/client does not
 * export them. We define them here for type-safety across the app.
 */

export type UserRole = "USER" | "AGENT" | "ADMIN" | "REVIEWER";

export type InsuranceCategory =
  | "SALUD"
  | "VIDA"
  | "HOGAR"
  | "VEHICULO"
  | "ACCIDENTES"
  | "HOSPITALIZACION"
  | "INVALIDEZ"
  | "RESPONSABILIDAD_CIVIL"
  | "VIAJE"
  | "OTRO";

export type PolicyStatus =
  | "ACTIVE"
  | "EXPIRED"
  | "CANCELLED"
  | "PENDING_VERIFICATION"
  | "DRAFT";

export type ProcessingStatus =
  | "PENDING"
  | "QUEUED"
  | "EXTRACTING_TEXT"
  | "RUNNING_OCR"
  | "EXTRACTING_STRUCTURED"
  | "GENERATING_EMBEDDINGS"
  | "COMPLETED"
  | "FAILED"
  | "NEEDS_REVIEW";

export type ConsentType =
  | "TERMS_OF_SERVICE"
  | "PRIVACY_POLICY"
  | "DATA_PROCESSING"
  | "MARKETING";

export type ConfidenceLabel = "HIGH" | "MEDIUM" | "LOW" | "UNCERTAIN";
