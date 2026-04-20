/**
 * Claude-powered structured extraction of insurance policy data.
 *
 * Sends the extracted text to Claude with a detailed system prompt specific
 * to Chilean insurance policies. Returns a typed ExtractedPolicy object.
 */

import Anthropic from "@anthropic-ai/sdk";

// ── Types ─────────────────────────────────────────────────────────────────

export interface ExtractedCoverage {
  name: string;
  description?: string;
  category?: string;
  coveredAmount?: number;
  coveredPercent?: number;
  currency?: string;
  limitPerEvent?: number;
  limitAnnual?: number;
  confidence: number;
  sourceText?: string;
}

export interface ExtractedExclusion {
  description: string;
  category?: string;
  isAbsolute?: boolean;
  confidence: number;
  sourceText?: string;
}

export interface ExtractedDeductible {
  name: string;
  amount?: number;
  percentage?: number;
  currency?: string;
  appliesTo?: string;
  frequency?: string;
  confidence: number;
  sourceText?: string;
}

export interface ExtractedBeneficiary {
  name: string;
  rut?: string;
  relationship?: string;
  percentage?: number;
  isContingent?: boolean;
  confidence: number;
}

export interface ExtractedPolicy {
  policyNumber?: string;
  depositCode?: string;
  insuranceCompany?: string;
  category: string;
  subcategory?: string;
  ramo?: string;
  policyHolder?: string;
  insuredName?: string;
  insuredRut?: string;
  startDate?: string; // ISO date
  endDate?: string;   // ISO date
  premium?: number;
  premiumCurrency?: string;
  premiumFrequency?: string;
  totalInsuredAmount?: number;
  overallConfidence: number;
  coverages: ExtractedCoverage[];
  exclusions: ExtractedExclusion[];
  deductibles: ExtractedDeductible[];
  beneficiaries: ExtractedBeneficiary[];
  summary: string;
}

// ── Extraction ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Eres un experto analista de polizas de seguros chilenas. Tu tarea es extraer informacion estructurada de documentos de polizas.

CONTEXTO:
- Los documentos son polizas de seguros emitidas en Chile
- Los montos estan en CLP (pesos chilenos) salvo que se indique UF u otra moneda
- Los RUTs tienen formato XX.XXX.XXX-X
- Las companias comunes incluyen: MetLife, Consorcio, BCI Seguros, Mapfre, Liberty, Sura, Zurich, HDI, Cardif, Principal, etc.

CATEGORIAS VALIDAS:
SALUD, VIDA, HOGAR, VEHICULO, ACCIDENTES, HOSPITALIZACION, INVALIDEZ, RESPONSABILIDAD_CIVIL, VIAJE, OTRO

FRECUENCIAS DE PRIMA:
MONTHLY, QUARTERLY, SEMIANNUAL, ANNUAL, SINGLE

INSTRUCCIONES:
1. Extrae TODOS los datos que puedas encontrar en el documento
2. Para cada dato, asigna un nivel de confianza entre 0.0 y 1.0
3. Si un dato no esta presente, omitelo (no inventes)
4. Para coberturas, extrae montos en CLP (convierte UF si es posible, 1 UF ~ 37.000 CLP)
5. Incluye el texto fuente exacto donde encontraste cada dato importante
6. Las exclusiones son condiciones donde la poliza NO cubre

Responde EXCLUSIVAMENTE con JSON valido, sin markdown ni texto adicional.`;

const USER_PROMPT_TEMPLATE = `Analiza el siguiente documento de poliza de seguro y extrae toda la informacion estructurada.

NOMBRE DEL ARCHIVO: {fileName}

TEXTO DEL DOCUMENTO:
---
{text}
---

Responde con un JSON con esta estructura exacta:
{
  "policyNumber": "string o null",
  "depositCode": "string o null (codigo de deposito CMF/SVS)",
  "insuranceCompany": "string o null",
  "category": "SALUD|VIDA|HOGAR|VEHICULO|ACCIDENTES|HOSPITALIZACION|INVALIDEZ|RESPONSABILIDAD_CIVIL|VIAJE|OTRO",
  "subcategory": "string o null",
  "ramo": "string o null",
  "policyHolder": "string o null (contratante)",
  "insuredName": "string o null (asegurado)",
  "insuredRut": "string o null",
  "startDate": "YYYY-MM-DD o null",
  "endDate": "YYYY-MM-DD o null",
  "premium": number o null (en CLP),
  "premiumCurrency": "CLP|UF",
  "premiumFrequency": "MONTHLY|QUARTERLY|SEMIANNUAL|ANNUAL|SINGLE|null",
  "totalInsuredAmount": number o null (monto total asegurado en CLP),
  "overallConfidence": number (0.0-1.0),
  "coverages": [
    {
      "name": "nombre de la cobertura",
      "description": "descripcion detallada",
      "category": "string o null",
      "coveredAmount": number o null (en CLP),
      "coveredPercent": number o null (porcentaje),
      "currency": "CLP|UF",
      "limitPerEvent": number o null,
      "limitAnnual": number o null,
      "confidence": number (0.0-1.0),
      "sourceText": "texto exacto de donde se extrajo"
    }
  ],
  "exclusions": [
    {
      "description": "descripcion de la exclusion",
      "category": "string o null",
      "isAbsolute": boolean,
      "confidence": number (0.0-1.0),
      "sourceText": "texto exacto"
    }
  ],
  "deductibles": [
    {
      "name": "nombre del deducible/carencia",
      "amount": number o null (en CLP),
      "percentage": number o null,
      "currency": "CLP|UF",
      "appliesTo": "string o null (a que aplica)",
      "frequency": "string o null (por evento, anual, etc.)",
      "confidence": number (0.0-1.0),
      "sourceText": "texto exacto"
    }
  ],
  "beneficiaries": [
    {
      "name": "nombre del beneficiario",
      "rut": "string o null",
      "relationship": "string o null",
      "percentage": number o null,
      "isContingent": boolean,
      "confidence": number (0.0-1.0)
    }
  ],
  "summary": "Resumen ejecutivo de la poliza en 2-3 oraciones en espanol"
}`;

/**
 * Send extracted text to Claude for structured analysis.
 * Optionally includes the original image for vision-enhanced extraction.
 */
export async function extractPolicyWithClaude(
  text: string,
  fileName: string,
  imageBuffer?: Buffer,
  imageType?: string,
): Promise<ExtractedPolicy> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Truncate very long documents to fit context window
  const maxChars = 120_000; // ~30k tokens
  const truncatedText = text.length > maxChars ? text.slice(0, maxChars) + "\n\n[... documento truncado ...]" : text;

  const userPrompt = USER_PROMPT_TEMPLATE
    .replace("{fileName}", fileName)
    .replace("{text}", truncatedText);

  // Build message content
  const content: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

  // If we have the original image, include it for better accuracy
  if (imageBuffer && imageType) {
    const mediaType = mapMediaType(imageType);
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: mediaType,
        data: imageBuffer.toString("base64"),
      },
    });
  }

  content.push({ type: "text", text: userPrompt });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  });

  const responseText = response.content[0].type === "text" ? response.content[0].text : "";

  // Parse JSON response (Claude might wrap it in ```json ... ```)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed: any = parseJsonResponse(responseText);

  // Validate and set defaults
  return {
    policyNumber: parsed.policyNumber ?? undefined,
    depositCode: parsed.depositCode ?? undefined,
    insuranceCompany: parsed.insuranceCompany ?? undefined,
    category: validCategory(parsed.category),
    subcategory: parsed.subcategory ?? undefined,
    ramo: parsed.ramo ?? undefined,
    policyHolder: parsed.policyHolder ?? undefined,
    insuredName: parsed.insuredName ?? undefined,
    insuredRut: parsed.insuredRut ?? undefined,
    startDate: parsed.startDate ?? undefined,
    endDate: parsed.endDate ?? undefined,
    premium: parsed.premium ?? undefined,
    premiumCurrency: parsed.premiumCurrency ?? "CLP",
    premiumFrequency: parsed.premiumFrequency ?? undefined,
    totalInsuredAmount: parsed.totalInsuredAmount ?? undefined,
    overallConfidence: clamp(parsed.overallConfidence ?? 0.5, 0, 1),
    coverages: Array.isArray(parsed.coverages) ? parsed.coverages.map(normalizeCoverage) : [],
    exclusions: Array.isArray(parsed.exclusions) ? parsed.exclusions.map(normalizeExclusion) : [],
    deductibles: Array.isArray(parsed.deductibles) ? parsed.deductibles.map(normalizeDeductible) : [],
    beneficiaries: Array.isArray(parsed.beneficiaries) ? parsed.beneficiaries.map(normalizeBeneficiary) : [],
    summary: parsed.summary ?? "Poliza extraida automaticamente",
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function parseJsonResponse(text: string): Record<string, unknown> {
  // Remove markdown code fences if present
  let clean = text.trim();
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  try {
    return JSON.parse(clean);
  } catch {
    // Try to find JSON object in response
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // fallthrough
      }
    }
    console.error("[extract-policy] Failed to parse Claude response as JSON");
    return {};
  }
}

const VALID_CATEGORIES = new Set([
  "SALUD", "VIDA", "HOGAR", "VEHICULO", "ACCIDENTES",
  "HOSPITALIZACION", "INVALIDEZ", "RESPONSABILIDAD_CIVIL", "VIAJE", "OTRO",
]);

function validCategory(cat: unknown): string {
  if (typeof cat === "string" && VALID_CATEGORIES.has(cat)) return cat;
  return "OTRO";
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeCoverage(c: any): ExtractedCoverage {
  return {
    name: String(c.name ?? "Cobertura sin nombre"),
    description: c.description ?? undefined,
    category: c.category ?? undefined,
    coveredAmount: typeof c.coveredAmount === "number" ? c.coveredAmount : undefined,
    coveredPercent: typeof c.coveredPercent === "number" ? c.coveredPercent : undefined,
    currency: c.currency ?? "CLP",
    limitPerEvent: typeof c.limitPerEvent === "number" ? c.limitPerEvent : undefined,
    limitAnnual: typeof c.limitAnnual === "number" ? c.limitAnnual : undefined,
    confidence: clamp(typeof c.confidence === "number" ? c.confidence : 0.5, 0, 1),
    sourceText: c.sourceText ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeExclusion(e: any): ExtractedExclusion {
  return {
    description: String(e.description ?? "Exclusion sin detalle"),
    category: e.category ?? undefined,
    isAbsolute: e.isAbsolute ?? true,
    confidence: clamp(typeof e.confidence === "number" ? e.confidence : 0.5, 0, 1),
    sourceText: e.sourceText ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeDeductible(d: any): ExtractedDeductible {
  return {
    name: String(d.name ?? "Deducible"),
    amount: typeof d.amount === "number" ? d.amount : undefined,
    percentage: typeof d.percentage === "number" ? d.percentage : undefined,
    currency: d.currency ?? "CLP",
    appliesTo: d.appliesTo ?? undefined,
    frequency: d.frequency ?? undefined,
    confidence: clamp(typeof d.confidence === "number" ? d.confidence : 0.5, 0, 1),
    sourceText: d.sourceText ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeBeneficiary(b: any): ExtractedBeneficiary {
  return {
    name: String(b.name ?? "Beneficiario"),
    rut: b.rut ?? undefined,
    relationship: b.relationship ?? undefined,
    percentage: typeof b.percentage === "number" ? b.percentage : undefined,
    isContingent: b.isContingent ?? false,
    confidence: clamp(typeof b.confidence === "number" ? b.confidence : 0.5, 0, 1),
  };
}

function mapMediaType(
  fileType: string,
): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  if (fileType.includes("png")) return "image/png";
  if (fileType.includes("webp")) return "image/webp";
  if (fileType.includes("gif")) return "image/gif";
  return "image/jpeg";
}
