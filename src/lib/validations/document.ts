import { z } from "zod";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "../constants";

export const presignRequestSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string().refine((type) => ACCEPTED_FILE_TYPES.includes(type), {
    message: "Tipo de archivo no soportado. Use PDF, JPG, PNG, WebP o TIFF.",
  }),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE, {
    message: `El archivo no puede exceder ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
  }),
});

export const processDocumentSchema = z.object({
  documentId: z.string().cuid(),
});

export const createDocumentSchema = z.object({
  fileName: z.string().min(1, "Nombre de archivo requerido"),
  fileType: z.string().min(1, "Tipo de archivo requerido"),
  fileSize: z.number().positive("Tamano debe ser positivo").max(50 * 1024 * 1024, "Archivo muy grande"),
  storagePath: z.string().min(1, "Ruta de almacenamiento requerida"),
  storageBucket: z.string().optional(),
});

export type PresignRequest = z.infer<typeof presignRequestSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
