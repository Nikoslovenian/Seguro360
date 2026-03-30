/**
 * Motor de Alertas Inteligentes
 *
 * Genera alertas proactivas basadas en:
 * - Estado de polizas (vencimiento, renovacion)
 * - Perfil familiar (cambios de edad, hitos)
 * - Brechas de cobertura detectadas
 * - Cambios en primas
 * - Condiciones del mercado
 */

export interface SmartAlert {
  id: string;
  type: "vencimiento" | "brecha" | "familiar" | "prima" | "cobertura" | "legal" | "oportunidad";
  severity: "critica" | "alta" | "media" | "baja";
  title: string;
  description: string;
  recommendation: string;
  category?: string;
  relatedPolicyId?: string;
  dueDate?: string;
  icon: string;
  actionLabel?: string;
  actionHref?: string;
  isNew: boolean;
  createdAt: string;
}

interface FamilyContext {
  age: number;
  childrenAges: number[];
  hasPartner: boolean;
  partnerAge?: number;
  pets: { type: string; age: number; name: string }[];
}

interface PolicyContext {
  id: string;
  name: string;
  company: string;
  category: string;
  status: string;
  endDate: string;
  premium: number;
  previousPremium?: number;
  coverageLimit: number;
  hasComplementario: boolean;
  hasVida: boolean;
  hasHogar: boolean;
  hasInvalidez: boolean;
  hasCatastrofico: boolean;
}

export function generateSmartAlerts(
  family: FamilyContext,
  policies: PolicyContext[],
  today: Date = new Date(),
): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  const todayStr = today.toISOString().split("T")[0];

  // ── VENCIMIENTO alerts ──
  for (const p of policies) {
    if (!p.endDate || p.status !== "ACTIVE") continue;
    const end = new Date(p.endDate);
    const daysLeft = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) {
      alerts.push({
        id: `exp-${p.id}`, type: "vencimiento", severity: "critica",
        title: `Poliza vencida: ${p.name}`,
        description: `Tu poliza con ${p.company} vencio el ${p.endDate}. Estas sin cobertura en esta area.`,
        recommendation: "Contacta a tu corredor o aseguradora para renovar inmediatamente.",
        category: p.category, relatedPolicyId: p.id, dueDate: p.endDate,
        icon: "AlertOctagon", actionLabel: "Ver poliza", actionHref: "/documents",
        isNew: daysLeft >= -7, createdAt: todayStr,
      });
    } else if (daysLeft <= 15) {
      alerts.push({
        id: `exp15-${p.id}`, type: "vencimiento", severity: "critica",
        title: `Poliza vence en ${daysLeft} dias: ${p.name}`,
        description: `Tu poliza ${p.company} vence el ${p.endDate}. Si no la renuevas, quedaras sin cobertura de ${p.category.toLowerCase()}.`,
        recommendation: "Gestiona la renovacion esta semana para evitar periodos sin cobertura.",
        category: p.category, relatedPolicyId: p.id, dueDate: p.endDate,
        icon: "Clock", actionLabel: "Renovar", actionHref: "/documents",
        isNew: true, createdAt: todayStr,
      });
    } else if (daysLeft <= 30) {
      alerts.push({
        id: `exp30-${p.id}`, type: "vencimiento", severity: "alta",
        title: `Poliza vence en ${daysLeft} dias: ${p.name}`,
        description: `Tu poliza con ${p.company} vence el ${p.endDate}. Aprovecha de comparar condiciones antes de renovar.`,
        recommendation: "Revisa si las condiciones de renovacion mantienen las mismas coberturas y prima.",
        category: p.category, relatedPolicyId: p.id, dueDate: p.endDate,
        icon: "Clock", isNew: daysLeft <= 25, createdAt: todayStr,
      });
    } else if (daysLeft <= 60) {
      alerts.push({
        id: `exp60-${p.id}`, type: "vencimiento", severity: "media",
        title: `Renovacion proxima: ${p.name}`,
        description: `Tu poliza vence en ${daysLeft} dias (${p.endDate}). Buen momento para evaluar opciones.`,
        recommendation: "Compara cotizaciones de otras aseguradoras para asegurar la mejor relacion cobertura/precio.",
        category: p.category, dueDate: p.endDate,
        icon: "Calendar", isNew: false, createdAt: todayStr,
      });
    }
  }

  // ── PRIMA alerts ──
  for (const p of policies) {
    if (p.previousPremium && p.premium > p.previousPremium) {
      const increase = ((p.premium - p.previousPremium) / p.previousPremium) * 100;
      if (increase > 10) {
        alerts.push({
          id: `prima-${p.id}`, type: "prima", severity: increase > 20 ? "alta" : "media",
          title: `Prima subio ${increase.toFixed(0)}%: ${p.name}`,
          description: `Tu prima paso de $${p.previousPremium.toLocaleString("es-CL")} a $${p.premium.toLocaleString("es-CL")}/mes (+${increase.toFixed(0)}%).`,
          recommendation: "Cotiza con otras aseguradoras. Un aumento superior al 10% justifica comparar.",
          category: p.category, icon: "TrendingUp",
          actionLabel: "Comparar", actionHref: "/library",
          isNew: true, createdAt: todayStr,
        });
      }
    }
  }

  // ── BRECHA alerts ──
  const hasAny = (cat: string) => policies.some(p => p.category === cat && p.status === "ACTIVE");
  const complementario = policies.some(p => p.hasComplementario);

  if (!complementario) {
    alerts.push({
      id: "gap-complementario", type: "brecha", severity: "critica",
      title: "Sin seguro complementario de salud",
      description: "No tienes seguro complementario. El copago de FONASA/ISAPRE en libre eleccion puede ser 25-50% del total. Una cirugia de $5M podria costarte $1.5M de bolsillo.",
      recommendation: "Cotiza un seguro complementario. Es la cobertura con mejor relacion costo/beneficio para la mayoria de las familias chilenas.",
      category: "SALUD", icon: "HeartPulse",
      actionLabel: "Ver opciones", actionHref: "/library",
      isNew: false, createdAt: todayStr,
    });
  }

  if (!hasAny("VIDA") && (family.hasPartner || family.childrenAges.length > 0)) {
    alerts.push({
      id: "gap-vida", type: "brecha", severity: "critica",
      title: "Familia sin seguro de vida",
      description: `Tienes ${family.childrenAges.length} hijo(s)${family.hasPartner ? " y pareja" : ""} pero no cuentas con seguro de vida. Ante un fallecimiento, tu familia quedaria sin sustento economico.`,
      recommendation: "Un seguro de vida de al menos 5x tu ingreso anual protege a tu familia. Desde $15.000/mes.",
      category: "VIDA", icon: "Shield",
      actionLabel: "Evaluar opciones", actionHref: "/library",
      isNew: false, createdAt: todayStr,
    });
  }

  if (!hasAny("HOGAR")) {
    alerts.push({
      id: "gap-hogar", type: "brecha", severity: "alta",
      title: "Sin seguro de hogar/contenido",
      description: "El seguro del credito hipotecario generalmente solo cubre incendio y terremoto de la estructura. No protege contenido, robo, ni danos por agua.",
      recommendation: "Un seguro de hogar integral cuesta desde $10.000/mes y protege tu patrimonio.",
      category: "HOGAR", icon: "Home",
      isNew: false, createdAt: todayStr,
    });
  }

  if (!policies.some(p => p.hasInvalidez)) {
    alerts.push({
      id: "gap-invalidez", type: "brecha", severity: "alta",
      title: "Sin seguro de invalidez complementario",
      description: "Si quedaras imposibilitado de trabajar, la pension del AFP/SIS seria una fraccion de tu ingreso actual.",
      recommendation: "Evalua un seguro de invalidez que complemente la pension del sistema previsional.",
      category: "INVALIDEZ", icon: "HeartPulse",
      isNew: false, createdAt: todayStr,
    });
  }

  // ── FAMILIAR alerts ──
  for (const childAge of family.childrenAges) {
    if (childAge === 17) {
      alerts.push({
        id: `child-18-${childAge}`, type: "familiar", severity: "alta",
        title: "Hijo/a proximo a cumplir 18 anos",
        description: "Al cumplir 18, tu hijo/a podria quedar fuera de la cobertura familiar de ISAPRE y seguros colectivos.",
        recommendation: "Verifica la edad limite de carga en tu ISAPRE y seguros. Algunos extienden hasta 24 si estudia.",
        icon: "Users", isNew: true, createdAt: todayStr,
      });
    }
    if (childAge >= 18 && childAge <= 24) {
      alerts.push({
        id: `child-carga-${childAge}`, type: "familiar", severity: "media",
        title: `Hijo/a de ${childAge} anos: verificar cobertura como carga`,
        description: "Algunos planes de ISAPRE y seguros colectivos mantienen la cobertura hasta los 24 anos si el hijo/a es estudiante regular.",
        recommendation: "Confirma con tu ISAPRE si necesitas acreditar estudios para mantener la cobertura.",
        icon: "GraduationCap", isNew: false, createdAt: todayStr,
      });
    }
  }

  if (family.age >= 50 && !policies.some(p => p.hasCatastrofico)) {
    alerts.push({
      id: "age-catastrofico", type: "familiar", severity: "alta",
      title: "Mayor de 50 sin cobertura catastrofica",
      description: "A partir de los 50, el riesgo de enfermedades graves (cancer, cardiovascular) aumenta significativamente. Un tratamiento oncologico puede superar los $40.000.000.",
      recommendation: "Evalua una cobertura catastrofica o verifica si tu ISAPRE tiene CAEC activo.",
      category: "SALUD", icon: "ShieldAlert",
      actionLabel: "Simular escenario", actionHref: "/simulate",
      isNew: false, createdAt: todayStr,
    });
  }

  if (family.age >= 60) {
    alerts.push({
      id: "age-60-primas", type: "familiar", severity: "media",
      title: "Revision de primas por edad",
      description: "A partir de los 60, muchas aseguradoras ajustan primas significativamente. Algunas polizas pueden no renovar pasados los 65-70 anos.",
      recommendation: "Revisa las clausulas de renovacion automatica y topes de edad de cada poliza.",
      icon: "Calendar", isNew: false, createdAt: todayStr,
    });
  }

  // Pet alerts
  for (const pet of family.pets) {
    const isSenior = (pet.type === "Perro" && pet.age >= 8) || (pet.type === "Gato" && pet.age >= 10);
    if (isSenior) {
      alerts.push({
        id: `pet-senior-${pet.name || pet.type}`, type: "familiar", severity: "baja",
        title: `Mascota senior: ${pet.name || pet.type} (${pet.age} anos)`,
        description: `Tu ${pet.type.toLowerCase()} tiene ${pet.age} anos. Los gastos veterinarios de emergencia pueden superar $500.000 por evento.`,
        recommendation: "Evalua un seguro veterinario. Desde $10.000/mes por mascota.",
        icon: "Heart", isNew: false, createdAt: todayStr,
      });
    }
  }

  // ── LEGAL / regulatory ──
  alerts.push({
    id: "legal-ley21719", type: "legal", severity: "baja",
    title: "Nueva Ley de Datos Personales (dic 2026)",
    description: "La Ley 21.719 entra en vigencia en diciembre 2026. Tus aseguradoras deberan cumplir nuevas obligaciones sobre el uso de tus datos.",
    recommendation: "Revisa los consentimientos otorgados a tus aseguradoras y ejercita tus derechos ARCO.",
    icon: "Scale", isNew: false, createdAt: todayStr,
  });

  // Sort: critical first, then by type
  const severityOrder = { critica: 0, alta: 1, media: 2, baja: 3 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}
