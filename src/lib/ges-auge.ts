/**
 * GES / AUGE - Garantias Explicitas en Salud (Chile)
 *
 * 87 patologias con garantias de acceso, oportunidad, proteccion financiera y calidad.
 * Aplica para FONASA e ISAPRE.
 *
 * Proteccion financiera GES:
 * - El copago maximo del afiliado esta regulado por ley
 * - Se calcula como % del arancel de referencia GES
 * - FONASA A y B: copago 0% (gratuito)
 * - FONASA C: copago 10%
 * - FONASA D: copago 20%
 * - ISAPRE: copago 20% del arancel de referencia
 *
 * CAEC (Cobertura Adicional para Enfermedades Catastroficas):
 * - Solo ISAPRE
 * - Se activa cuando el copago acumulado anual supera el deducible CAEC
 * - Deducible CAEC: generalmente 126 UF (~$4.700.000 CLP aprox)
 * - Despues del deducible, la ISAPRE cubre el 100% del exceso
 * - Requiere atencion en red de prestadores CAEC
 */

export interface GESPathology {
  id: number;
  name: string;
  category: string;
  /** Keywords to match user event descriptions */
  keywords: string[];
  /** Typical total cost range in CLP */
  typicalCostMin: number;
  typicalCostMax: number;
  /** Whether it's commonly surgical */
  isSurgical: boolean;
  /** Max waiting days for treatment guarantee */
  maxWaitDays: number;
}

// Representative subset of the 87 GES pathologies most relevant for simulation
export const GES_PATHOLOGIES: GESPathology[] = [
  // ─── CANCER ───
  { id: 1, name: "Cancer cervicouterino", category: "Cancer", keywords: ["cancer", "cervicouterino", "cuello uterino", "cervical"], typicalCostMin: 5000000, typicalCostMax: 25000000, isSurgical: true, maxWaitDays: 30 },
  { id: 2, name: "Cancer de mama", category: "Cancer", keywords: ["cancer", "mama", "seno", "mastectomia", "mamario"], typicalCostMin: 8000000, typicalCostMax: 35000000, isSurgical: true, maxWaitDays: 30 },
  { id: 3, name: "Cancer de testiculo", category: "Cancer", keywords: ["cancer", "testiculo", "testicular"], typicalCostMin: 5000000, typicalCostMax: 20000000, isSurgical: true, maxWaitDays: 30 },
  { id: 4, name: "Linfoma en adultos", category: "Cancer", keywords: ["linfoma", "hodgkin", "no hodgkin"], typicalCostMin: 10000000, typicalCostMax: 40000000, isSurgical: false, maxWaitDays: 30 },
  { id: 5, name: "Cancer gastrico", category: "Cancer", keywords: ["cancer", "gastrico", "estomago", "gastric"], typicalCostMin: 8000000, typicalCostMax: 30000000, isSurgical: true, maxWaitDays: 30 },
  { id: 6, name: "Cancer de prostata", category: "Cancer", keywords: ["cancer", "prostata", "prostatico"], typicalCostMin: 6000000, typicalCostMax: 25000000, isSurgical: true, maxWaitDays: 30 },
  { id: 7, name: "Leucemia en adultos", category: "Cancer", keywords: ["leucemia", "leucemico"], typicalCostMin: 15000000, typicalCostMax: 60000000, isSurgical: false, maxWaitDays: 14 },
  { id: 8, name: "Cancer de colon y recto", category: "Cancer", keywords: ["cancer", "colon", "recto", "colorrectal", "colonoscopia"], typicalCostMin: 8000000, typicalCostMax: 30000000, isSurgical: true, maxWaitDays: 30 },
  { id: 9, name: "Cancer de pulmon", category: "Cancer", keywords: ["cancer", "pulmon", "pulmonar"], typicalCostMin: 10000000, typicalCostMax: 45000000, isSurgical: true, maxWaitDays: 30 },
  { id: 10, name: "Cancer de vejiga", category: "Cancer", keywords: ["cancer", "vejiga", "vesical"], typicalCostMin: 6000000, typicalCostMax: 25000000, isSurgical: true, maxWaitDays: 30 },

  // ─── CARDIOVASCULAR ───
  { id: 11, name: "Infarto agudo del miocardio", category: "Cardiovascular", keywords: ["infarto", "miocardio", "cardiaco", "corazon", "coronario", "angioplastia", "bypass"], typicalCostMin: 5000000, typicalCostMax: 25000000, isSurgical: true, maxWaitDays: 0 },
  { id: 12, name: "Accidente cerebrovascular (ACV)", category: "Cardiovascular", keywords: ["acv", "cerebrovascular", "derrame", "ictus", "cerebral", "stroke"], typicalCostMin: 4000000, typicalCostMax: 20000000, isSurgical: false, maxWaitDays: 0 },
  { id: 13, name: "Cardiopatia congenita operable", category: "Cardiovascular", keywords: ["cardiopatia", "congenita", "corazon congenito"], typicalCostMin: 10000000, typicalCostMax: 40000000, isSurgical: true, maxWaitDays: 30 },
  { id: 14, name: "Trastornos del ritmo cardiaco (arritmias)", category: "Cardiovascular", keywords: ["arritmia", "marcapasos", "fibrilacion", "auricular"], typicalCostMin: 3000000, typicalCostMax: 15000000, isSurgical: true, maxWaitDays: 30 },

  // ─── TRAUMATOLOGICO / QUIRURGICO ───
  { id: 15, name: "Reemplazo articular de cadera", category: "Traumatologia", keywords: ["cadera", "protesis cadera", "artroplastia cadera", "reemplazo cadera"], typicalCostMin: 5000000, typicalCostMax: 12000000, isSurgical: true, maxWaitDays: 240 },
  { id: 16, name: "Reemplazo articular de rodilla", category: "Traumatologia", keywords: ["rodilla", "protesis rodilla", "artroplastia rodilla", "reemplazo rodilla", "artroscopia"], typicalCostMin: 4500000, typicalCostMax: 12000000, isSurgical: true, maxWaitDays: 240 },
  { id: 17, name: "Fractura de cadera en adulto mayor", category: "Traumatologia", keywords: ["fractura", "cadera", "femur", "adulto mayor"], typicalCostMin: 3000000, typicalCostMax: 8000000, isSurgical: true, maxWaitDays: 2 },
  { id: 18, name: "Escoliosis", category: "Traumatologia", keywords: ["escoliosis", "columna", "espalda"], typicalCostMin: 5000000, typicalCostMax: 20000000, isSurgical: true, maxWaitDays: 180 },
  { id: 19, name: "Hernia del nucleo pulposo", category: "Traumatologia", keywords: ["hernia", "nucleo pulposo", "disco", "lumbar", "cervical", "columna"], typicalCostMin: 2000000, typicalCostMax: 8000000, isSurgical: true, maxWaitDays: 60 },

  // ─── OFTALMOLOGICO ───
  { id: 20, name: "Cataratas", category: "Oftalmologia", keywords: ["catarata", "cristalino", "lente intraocular", "ojo"], typicalCostMin: 800000, typicalCostMax: 3000000, isSurgical: true, maxWaitDays: 180 },
  { id: 21, name: "Glaucoma", category: "Oftalmologia", keywords: ["glaucoma", "presion ocular", "ojo"], typicalCostMin: 500000, typicalCostMax: 5000000, isSurgical: false, maxWaitDays: 30 },
  { id: 22, name: "Desprendimiento de retina", category: "Oftalmologia", keywords: ["retina", "desprendimiento", "vitrectomia"], typicalCostMin: 2000000, typicalCostMax: 6000000, isSurgical: true, maxWaitDays: 7 },
  { id: 23, name: "Retinopatia diabetica", category: "Oftalmologia", keywords: ["retinopatia", "diabetica", "retina", "diabetes"], typicalCostMin: 1000000, typicalCostMax: 5000000, isSurgical: false, maxWaitDays: 30 },

  // ─── SALUD MENTAL ───
  { id: 24, name: "Depresion en mayores de 15 anos", category: "Salud Mental", keywords: ["depresion", "depresivo", "antidepresivo", "salud mental"], typicalCostMin: 200000, typicalCostMax: 2000000, isSurgical: false, maxWaitDays: 30 },
  { id: 25, name: "Esquizofrenia", category: "Salud Mental", keywords: ["esquizofrenia", "psicotico", "psicosis"], typicalCostMin: 500000, typicalCostMax: 5000000, isSurgical: false, maxWaitDays: 20 },
  { id: 26, name: "Trastorno bipolar", category: "Salud Mental", keywords: ["bipolar", "mania", "trastorno animo"], typicalCostMin: 300000, typicalCostMax: 3000000, isSurgical: false, maxWaitDays: 30 },
  { id: 27, name: "Consumo problematico de alcohol y drogas", category: "Salud Mental", keywords: ["alcohol", "drogas", "adiccion", "dependencia", "sustancias"], typicalCostMin: 500000, typicalCostMax: 5000000, isSurgical: false, maxWaitDays: 10 },

  // ─── CRONICO / METABOLICO ───
  { id: 28, name: "Diabetes mellitus tipo 1", category: "Cronico", keywords: ["diabetes", "tipo 1", "insulina", "insulinodependiente"], typicalCostMin: 500000, typicalCostMax: 3000000, isSurgical: false, maxWaitDays: 30 },
  { id: 29, name: "Diabetes mellitus tipo 2", category: "Cronico", keywords: ["diabetes", "tipo 2", "glicemia", "metformina"], typicalCostMin: 300000, typicalCostMax: 2000000, isSurgical: false, maxWaitDays: 30 },
  { id: 30, name: "Hipertension arterial primaria", category: "Cronico", keywords: ["hipertension", "presion alta", "arterial"], typicalCostMin: 200000, typicalCostMax: 1000000, isSurgical: false, maxWaitDays: 30 },
  { id: 31, name: "Enfermedad renal cronica (dialisis)", category: "Cronico", keywords: ["renal", "rinon", "dialisis", "hemodialisis", "cronica renal", "transplante renal"], typicalCostMin: 5000000, typicalCostMax: 30000000, isSurgical: false, maxWaitDays: 7 },
  { id: 32, name: "Hipotiroidismo", category: "Cronico", keywords: ["hipotiroidismo", "tiroides", "levotiroxina"], typicalCostMin: 100000, typicalCostMax: 500000, isSurgical: false, maxWaitDays: 30 },
  { id: 33, name: "Epilepsia", category: "Cronico", keywords: ["epilepsia", "convulsion", "epileptico"], typicalCostMin: 300000, typicalCostMax: 3000000, isSurgical: false, maxWaitDays: 30 },
  { id: 34, name: "Artritis reumatoide", category: "Cronico", keywords: ["artritis", "reumatoide", "reumatismo", "articular"], typicalCostMin: 500000, typicalCostMax: 10000000, isSurgical: false, maxWaitDays: 30 },

  // ─── RESPIRATORIO ───
  { id: 35, name: "Asma bronquial", category: "Respiratorio", keywords: ["asma", "bronquial", "broncodilatador"], typicalCostMin: 200000, typicalCostMax: 2000000, isSurgical: false, maxWaitDays: 30 },
  { id: 36, name: "EPOC (Enfermedad Pulmonar Obstructiva Cronica)", category: "Respiratorio", keywords: ["epoc", "pulmonar obstructiva", "enfisema", "bronquitis cronica"], typicalCostMin: 300000, typicalCostMax: 5000000, isSurgical: false, maxWaitDays: 30 },
  { id: 37, name: "Neumonia adquirida en comunidad", category: "Respiratorio", keywords: ["neumonia", "pulmon", "neumonitis"], typicalCostMin: 500000, typicalCostMax: 5000000, isSurgical: false, maxWaitDays: 0 },

  // ─── PEDIATRICO ───
  { id: 38, name: "Prematurez", category: "Pediatrico", keywords: ["prematuro", "prematurez", "neonato"], typicalCostMin: 5000000, typicalCostMax: 50000000, isSurgical: false, maxWaitDays: 0 },
  { id: 39, name: "Displasia del desarrollo de cadera", category: "Pediatrico", keywords: ["displasia", "cadera", "lactante"], typicalCostMin: 500000, typicalCostMax: 3000000, isSurgical: false, maxWaitDays: 30 },
  { id: 40, name: "Fisura labiopalatina", category: "Pediatrico", keywords: ["fisura", "labio", "paladar", "labiopalatina"], typicalCostMin: 2000000, typicalCostMax: 10000000, isSurgical: true, maxWaitDays: 60 },

  // ─── DIGESTIVO ───
  { id: 41, name: "Colecistectomia (vesicula)", category: "Digestivo", keywords: ["vesicula", "colecistectomia", "calculo biliar", "biliar", "vesicula biliar"], typicalCostMin: 1500000, typicalCostMax: 5000000, isSurgical: true, maxWaitDays: 90 },
  { id: 42, name: "Hepatitis B", category: "Digestivo", keywords: ["hepatitis", "higado", "hepatitis b"], typicalCostMin: 500000, typicalCostMax: 5000000, isSurgical: false, maxWaitDays: 30 },
  { id: 43, name: "Hepatitis C", category: "Digestivo", keywords: ["hepatitis c", "hepatitis", "higado"], typicalCostMin: 2000000, typicalCostMax: 15000000, isSurgical: false, maxWaitDays: 30 },

  // ─── OTROS COMUNES ───
  { id: 44, name: "VIH/SIDA", category: "Infeccioso", keywords: ["vih", "sida", "hiv", "antirretroviral"], typicalCostMin: 2000000, typicalCostMax: 10000000, isSurgical: false, maxWaitDays: 7 },
  { id: 45, name: "Insuficiencia cardiaca", category: "Cardiovascular", keywords: ["insuficiencia cardiaca", "corazon", "cardiaco"], typicalCostMin: 2000000, typicalCostMax: 15000000, isSurgical: false, maxWaitDays: 30 },
  { id: 46, name: "Hemofilia", category: "Hematologico", keywords: ["hemofilia", "coagulacion", "sangrado"], typicalCostMin: 5000000, typicalCostMax: 30000000, isSurgical: false, maxWaitDays: 7 },
  { id: 47, name: "Gran quemado", category: "Emergencia", keywords: ["quemadura", "quemado", "quemadura grave"], typicalCostMin: 10000000, typicalCostMax: 80000000, isSurgical: true, maxWaitDays: 0 },
  { id: 48, name: "Politraumatizado grave", category: "Emergencia", keywords: ["politraumatismo", "trauma", "accidente grave", "politraumatizado"], typicalCostMin: 5000000, typicalCostMax: 50000000, isSurgical: true, maxWaitDays: 0 },
  { id: 49, name: "Apendicitis aguda", category: "Digestivo", keywords: ["apendicitis", "apendice", "apendicectomia"], typicalCostMin: 1500000, typicalCostMax: 5000000, isSurgical: true, maxWaitDays: 1 },
  { id: 50, name: "Tratamiento dental integral (menores de 20)", category: "Dental", keywords: ["dental", "diente", "muela", "endodoncia", "caries"], typicalCostMin: 100000, typicalCostMax: 500000, isSurgical: false, maxWaitDays: 60 },
];

// ─── GES copay rules ────────────────────────────────────────────────────────

export type HealthSystemType = "FONASA_A" | "FONASA_B" | "FONASA_C" | "FONASA_D" | "ISAPRE";

/** GES copay percentage by health system */
export function getGESCopayPercent(healthSystem: HealthSystemType): number {
  switch (healthSystem) {
    case "FONASA_A": return 0;   // Tramo A: 0% copago GES
    case "FONASA_B": return 0;   // Tramo B: 0% copago GES
    case "FONASA_C": return 10;  // Tramo C: 10% copago GES
    case "FONASA_D": return 20;  // Tramo D: 20% copago GES
    case "ISAPRE":   return 20;  // ISAPRE: 20% copago GES
  }
}

/** Detect if a description matches any GES pathology */
export function detectGESPathology(description: string): GESPathology | null {
  const lower = description.toLowerCase();
  let bestMatch: GESPathology | null = null;
  let bestScore = 0;

  for (const pathology of GES_PATHOLOGIES) {
    let score = 0;
    for (const kw of pathology.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += kw.length; // longer keyword matches are more specific
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = pathology;
    }
  }

  return bestScore >= 3 ? bestMatch : null;
}

// ─── CAEC ────────────────────────────────────────────────────────────────────

/** CAEC deductible in CLP (~126 UF) */
export const CAEC_DEDUCTIBLE_CLP = 4700000;

/**
 * CAEC only applies to ISAPRE beneficiaries.
 * Activates when accumulated annual copay exceeds the deductible (~126 UF).
 * After activation, ISAPRE covers 100% of excess costs.
 * Must use CAEC-network providers.
 */
export function calculateCAEC(
  healthSystem: HealthSystemType,
  totalAnnualCopay: number,
  currentEventCopay: number,
): { applies: boolean; coveredByCAEC: number; note: string } {
  if (!healthSystem.startsWith("ISAPRE") && healthSystem !== "ISAPRE") {
    return {
      applies: false,
      coveredByCAEC: 0,
      note: "CAEC solo aplica para afiliados a ISAPRE",
    };
  }

  const accumulatedWithEvent = totalAnnualCopay + currentEventCopay;

  if (accumulatedWithEvent <= CAEC_DEDUCTIBLE_CLP) {
    return {
      applies: false,
      coveredByCAEC: 0,
      note: `Copago acumulado ($${totalAnnualCopay.toLocaleString("es-CL")}) + evento ($${currentEventCopay.toLocaleString("es-CL")}) = $${accumulatedWithEvent.toLocaleString("es-CL")} no supera el deducible CAEC de $${CAEC_DEDUCTIBLE_CLP.toLocaleString("es-CL")} (~126 UF)`,
    };
  }

  // CAEC covers the excess above the deductible
  const excessAboveDeductible = accumulatedWithEvent - CAEC_DEDUCTIBLE_CLP;
  const coveredByCAEC = Math.min(excessAboveDeductible, currentEventCopay);

  return {
    applies: true,
    coveredByCAEC,
    note: `Copago acumulado supera deducible CAEC. ISAPRE cubre 100% del exceso ($${coveredByCAEC.toLocaleString("es-CL")})`,
  };
}
