import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHmac } from "crypto";

const prisma = new PrismaClient();

function hmacRut(rut: string): string {
  const key = process.env.RUT_HMAC_KEY || process.env.ENCRYPTION_KEY || "dev-seed-key";
  return createHmac("sha256", key).update(rut.toLowerCase().trim()).digest("hex");
}

async function main() {
  console.log("Seeding database...");

  // ── Admin user ──
  const adminPassword = await bcrypt.hash("Admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@seguro360.cl" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@seguro360.cl",
      hashedPassword: adminPassword,
      role: "ADMIN",
      rut: "111111111",
      rutHash: hmacRut("111111111"),
      onboardingComplete: true,
    },
  });
  console.log(`  Admin: ${admin.email}`);

  // ── Agent user ──
  const agentPassword = await bcrypt.hash("Agent123!", 12);
  const agent = await prisma.user.upsert({
    where: { email: "agente@seguro360.cl" },
    update: {},
    create: {
      name: "Maria Gonzalez",
      email: "agente@seguro360.cl",
      hashedPassword: agentPassword,
      role: "AGENT",
      rut: "123456789",
      rutHash: hmacRut("123456789"),
      onboardingComplete: true,
    },
  });
  console.log(`  Agent: ${agent.email}`);

  // Create agent profile
  await prisma.agentProfile.upsert({
    where: { userId: agent.id },
    update: {},
    create: {
      userId: agent.id,
      licenseNumber: "AG-2024-001",
      specializations: JSON.stringify(["SALUD", "VIDA", "VEHICULO"]),
      bio: "Agente de seguros con 10 años de experiencia en el mercado chileno.",
      isActive: true,
    },
  });

  // ── Demo user ──
  const userPassword = await bcrypt.hash("User1234!", 12);
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@seguro360.cl" },
    update: {},
    create: {
      name: "Carlos Perez",
      email: "demo@seguro360.cl",
      hashedPassword: userPassword,
      role: "USER",
      rut: "176543210",
      rutHash: hmacRut("176543210"),
      phone: "+56912345678",
      onboardingComplete: true,
    },
  });
  console.log(`  Demo user: ${demoUser.email}`);

  // ── Policies for demo user ──

  // 1. Seguro Complementario de Salud
  const healthPolicy = await prisma.insurancePolicy.create({
    data: {
      userId: demoUser.id,
      policyNumber: "SCS-2024-00187",
      insuranceCompany: "MetLife Chile",
      category: "SALUD",
      subcategory: "Complementario",
      ramo: "Salud",
      policyHolder: "Carlos Perez",
      insuredName: "Carlos Perez",
      insuredRut: "17.654.321-0",
      startDate: new Date("2024-01-15"),
      endDate: new Date("2025-01-15"),
      premium: 45000,
      premiumCurrency: "CLP",
      premiumFrequency: "MONTHLY",
      totalInsuredAmount: 5000000,
      status: "ACTIVE",
      isVerified: true,
      source: "MANUAL_ENTRY",
      overallConfidence: 0.95,
    },
  });

  // Health policy coverages
  await prisma.coverage.createMany({
    data: [
      { policyId: healthPolicy.id, name: "Consultas medicas", coveredAmount: 500000, coveredPercent: 80, currency: "CLP", limitAnnual: 500000, confidence: 0.95, sourceAttribution: "SEED_DATA" },
      { policyId: healthPolicy.id, name: "Hospitalizacion", coveredAmount: 3000000, coveredPercent: 80, currency: "CLP", limitPerEvent: 3000000, confidence: 0.95, sourceAttribution: "SEED_DATA" },
      { policyId: healthPolicy.id, name: "Cirugia", coveredAmount: 5000000, coveredPercent: 80, currency: "CLP", limitPerEvent: 5000000, confidence: 0.95, sourceAttribution: "SEED_DATA" },
      { policyId: healthPolicy.id, name: "Medicamentos", coveredAmount: 200000, coveredPercent: 70, currency: "CLP", limitAnnual: 200000, confidence: 0.90, sourceAttribution: "SEED_DATA" },
      { policyId: healthPolicy.id, name: "Urgencias", coveredAmount: 1000000, coveredPercent: 80, currency: "CLP", limitPerEvent: 1000000, confidence: 0.95, sourceAttribution: "SEED_DATA" },
    ],
  });

  await prisma.exclusion.createMany({
    data: [
      { policyId: healthPolicy.id, description: "Enfermedades preexistentes no declaradas", category: "Preexistencia", isAbsolute: true, confidence: 0.95, sourceAttribution: "SEED_DATA" },
      { policyId: healthPolicy.id, description: "Cirugia estetica o cosmetica sin indicacion medica", category: "Estetica", isAbsolute: true, confidence: 0.95, sourceAttribution: "SEED_DATA" },
      { policyId: healthPolicy.id, description: "Tratamientos experimentales no aprobados", category: "Experimental", isAbsolute: true, confidence: 0.90, sourceAttribution: "SEED_DATA" },
    ],
  });

  await prisma.deductible.createMany({
    data: [
      { policyId: healthPolicy.id, name: "Deducible general", amount: 200000, currency: "CLP", appliesTo: "Todos los eventos", frequency: "PER_EVENT", confidence: 0.95, sourceAttribution: "SEED_DATA" },
    ],
  });

  await prisma.benefitLimit.createMany({
    data: [
      { policyId: healthPolicy.id, name: "Copago consultas", limitType: "COPAY", percentage: 20, currency: "CLP", period: "PER_EVENT", confidence: 0.95, sourceAttribution: "SEED_DATA" },
      { policyId: healthPolicy.id, name: "Tope anual general", limitType: "CAP", amount: 5000000, currency: "CLP", period: "ANNUAL", confidence: 0.95, sourceAttribution: "SEED_DATA" },
    ],
  });

  // 2. Seguro de Vida
  const lifePolicy = await prisma.insurancePolicy.create({
    data: {
      userId: demoUser.id,
      policyNumber: "VID-2024-03421",
      insuranceCompany: "Consorcio Nacional de Seguros",
      category: "VIDA",
      ramo: "Vida Individual",
      policyHolder: "Carlos Perez",
      insuredName: "Carlos Perez",
      insuredRut: "17.654.321-0",
      startDate: new Date("2024-03-01"),
      endDate: new Date("2025-03-01"),
      premium: 25000,
      premiumCurrency: "CLP",
      premiumFrequency: "MONTHLY",
      totalInsuredAmount: 50000000,
      status: "ACTIVE",
      isVerified: true,
      source: "MANUAL_ENTRY",
      overallConfidence: 0.95,
    },
  });

  await prisma.coverage.createMany({
    data: [
      { policyId: lifePolicy.id, name: "Fallecimiento natural", coveredAmount: 50000000, currency: "CLP", confidence: 0.95, sourceAttribution: "SEED_DATA" },
      { policyId: lifePolicy.id, name: "Muerte accidental (doble indemnizacion)", coveredAmount: 100000000, currency: "CLP", confidence: 0.95, sourceAttribution: "SEED_DATA" },
      { policyId: lifePolicy.id, name: "Invalidez total y permanente", coveredAmount: 50000000, currency: "CLP", confidence: 0.95, sourceAttribution: "SEED_DATA" },
      { policyId: lifePolicy.id, name: "Enfermedades graves", coveredAmount: 25000000, currency: "CLP", confidence: 0.90, sourceAttribution: "SEED_DATA" },
    ],
  });

  await prisma.beneficiary.createMany({
    data: [
      { policyId: lifePolicy.id, name: "Ana Perez", relationship: "Conyuge", percentage: 60, isContingent: false, confidence: 0.95, sourceAttribution: "SEED_DATA" },
      { policyId: lifePolicy.id, name: "Sofia Perez", relationship: "Hija", percentage: 20, isContingent: false, confidence: 0.95, sourceAttribution: "SEED_DATA" },
      { policyId: lifePolicy.id, name: "Diego Perez", relationship: "Hijo", percentage: 20, isContingent: false, confidence: 0.95, sourceAttribution: "SEED_DATA" },
    ],
  });

  // 3. Seguro Automotriz
  const autoPolicy = await prisma.insurancePolicy.create({
    data: {
      userId: demoUser.id,
      policyNumber: "AUT-2024-78932",
      insuranceCompany: "BCI Seguros",
      category: "VEHICULO",
      ramo: "Automotriz Todo Riesgo",
      policyHolder: "Carlos Perez",
      insuredName: "Carlos Perez",
      insuredRut: "17.654.321-0",
      startDate: new Date("2024-06-01"),
      endDate: new Date("2025-06-01"),
      premium: 35000,
      premiumCurrency: "CLP",
      premiumFrequency: "MONTHLY",
      totalInsuredAmount: 15000000,
      status: "ACTIVE",
      isVerified: true,
      source: "MANUAL_ENTRY",
      overallConfidence: 0.95,
    },
  });

  await prisma.coverage.createMany({
    data: [
      { policyId: autoPolicy.id, name: "Danos propios", coveredAmount: 15000000, currency: "CLP", confidence: 0.95, sourceAttribution: "SEED_DATA" },
      { policyId: autoPolicy.id, name: "Responsabilidad civil", coveredAmount: 10000000, currency: "CLP", confidence: 0.95, sourceAttribution: "SEED_DATA" },
      { policyId: autoPolicy.id, name: "Robo total", coveredAmount: 15000000, currency: "CLP", confidence: 0.95, sourceAttribution: "SEED_DATA" },
      { policyId: autoPolicy.id, name: "Robo parcial", coveredAmount: 5000000, currency: "CLP", confidence: 0.90, sourceAttribution: "SEED_DATA" },
      { policyId: autoPolicy.id, name: "Asistencia en ruta y grua", coveredAmount: 500000, currency: "CLP", confidence: 0.90, sourceAttribution: "SEED_DATA" },
    ],
  });

  await prisma.deductible.createMany({
    data: [
      { policyId: autoPolicy.id, name: "Deducible danos propios", amount: 110000, currency: "CLP", appliesTo: "Danos propios y colision", frequency: "PER_EVENT", confidence: 0.95, sourceAttribution: "SEED_DATA" },
    ],
  });

  await prisma.exclusion.createMany({
    data: [
      { policyId: autoPolicy.id, description: "Conduccion bajo influencia de alcohol o drogas", category: "Conducta", isAbsolute: true, confidence: 0.95, sourceAttribution: "SEED_DATA" },
      { policyId: autoPolicy.id, description: "Uso del vehiculo para carreras o competencias", category: "Uso", isAbsolute: true, confidence: 0.95, sourceAttribution: "SEED_DATA" },
      { policyId: autoPolicy.id, description: "Desgaste natural y fallas mecanicas", category: "Mantenimiento", isAbsolute: true, confidence: 0.95, sourceAttribution: "SEED_DATA" },
    ],
  });

  // 4. SOAP Obligatorio
  await prisma.insurancePolicy.create({
    data: {
      userId: demoUser.id,
      policyNumber: "SOAP-2024-45120",
      insuranceCompany: "Liberty Seguros",
      category: "VEHICULO",
      subcategory: "SOAP",
      ramo: "Accidentes Personales Vehiculares",
      policyHolder: "Carlos Perez",
      startDate: new Date("2024-03-31"),
      endDate: new Date("2025-03-31"),
      premium: 8000,
      premiumCurrency: "CLP",
      premiumFrequency: "ANNUAL",
      totalInsuredAmount: 4000000,
      status: "ACTIVE",
      isVerified: true,
      source: "MANUAL_ENTRY",
      overallConfidence: 0.95,
    },
  });

  console.log(`  Created 4 policies for demo user`);

  // ── Policy Library Entries ──
  // Delete existing library entries to avoid duplicates on re-seed
  await prisma.policyLibraryEntry.deleteMany({});
  await prisma.policyLibraryEntry.createMany({
    data: [
      {
        cmfCode: "CMF-SCS-001",
        insuranceCompany: "MetLife Chile",
        productName: "Seguro Complementario de Salud",
        category: "SALUD",
        ramo: "Salud",
        summary: "Cobertura complementaria para gastos medicos ambulatorios y hospitalizacion no cubiertos por Fonasa o Isapre. Incluye consultas, examenes, cirugia y medicamentos.",
        keyFeatures: JSON.stringify(["Cobertura ambulatoria", "Hospitalizacion", "Cirugia", "Medicamentos", "Urgencias"]),
        standardCoverages: JSON.stringify([
          { name: "Consultas medicas", limit: 500000 },
          { name: "Hospitalizacion", limit: 3000000 },
          { name: "Cirugia", limit: 5000000 },
        ]),
        standardExclusions: JSON.stringify(["Preexistencias no declaradas", "Cirugia estetica", "Tratamientos experimentales"]),
        typicalPremiumRange: JSON.stringify({ min: 30000, max: 80000, currency: "CLP", frequency: "MONTHLY" }),
        source: "CMF_DEPOSITO",
        isActive: true,
      },
      {
        cmfCode: "CMF-VID-001",
        insuranceCompany: "Consorcio Nacional de Seguros",
        productName: "Seguro de Vida Individual",
        category: "VIDA",
        ramo: "Vida Individual",
        summary: "Proteccion financiera para beneficiarios en caso de fallecimiento. Incluye cobertura por muerte natural, accidental e invalidez total y permanente.",
        keyFeatures: JSON.stringify(["Fallecimiento natural", "Muerte accidental", "Invalidez total", "Enfermedades graves"]),
        standardCoverages: JSON.stringify([
          { name: "Fallecimiento", limit: 50000000 },
          { name: "Doble indemnizacion accidental", limit: 100000000 },
          { name: "Invalidez total", limit: 50000000 },
        ]),
        standardExclusions: JSON.stringify(["Suicidio primer año", "Actividades extremas", "Guerra o terrorismo"]),
        typicalPremiumRange: JSON.stringify({ min: 15000, max: 60000, currency: "CLP", frequency: "MONTHLY" }),
        source: "CMF_DEPOSITO",
        isActive: true,
      },
      {
        cmfCode: "CMF-AUT-001",
        insuranceCompany: "BCI Seguros",
        productName: "Seguro Automotriz Todo Riesgo",
        category: "VEHICULO",
        ramo: "Automotriz",
        summary: "Cobertura integral para vehiculo: danos propios, robo, responsabilidad civil, asistencia en ruta y danos a terceros.",
        keyFeatures: JSON.stringify(["Danos propios", "Robo total y parcial", "Responsabilidad civil", "Grua", "Auto de reemplazo"]),
        standardCoverages: JSON.stringify([
          { name: "Danos propios", limit: 15000000 },
          { name: "Responsabilidad civil", limit: 10000000 },
          { name: "Robo", limit: 15000000 },
        ]),
        standardExclusions: JSON.stringify(["Conduccion bajo influencia", "Carreras", "Desgaste natural"]),
        typicalPremiumRange: JSON.stringify({ min: 25000, max: 80000, currency: "CLP", frequency: "MONTHLY" }),
        source: "CMF_DEPOSITO",
        isActive: true,
      },
      {
        cmfCode: "CMF-HOG-001",
        insuranceCompany: "Suramericana",
        productName: "Seguro de Hogar e Incendio",
        category: "HOGAR",
        ramo: "Hogar",
        summary: "Proteccion para vivienda y contenido contra incendio, terremoto, robo, danos por agua y responsabilidad civil familiar.",
        keyFeatures: JSON.stringify(["Incendio", "Terremoto", "Robo con fuerza", "Danos por agua", "Responsabilidad civil"]),
        standardCoverages: JSON.stringify([
          { name: "Incendio estructura", limit: 80000000 },
          { name: "Contenido", limit: 15000000 },
          { name: "Terremoto", limit: 60000000 },
        ]),
        standardExclusions: JSON.stringify(["Desgaste natural", "Actos intencionales", "Guerra"]),
        typicalPremiumRange: JSON.stringify({ min: 15000, max: 45000, currency: "CLP", frequency: "MONTHLY" }),
        source: "CMF_DEPOSITO",
        isActive: true,
      },
      {
        cmfCode: "CMF-ACC-001",
        insuranceCompany: "HDI Seguros",
        productName: "Seguro de Accidentes Personales",
        category: "ACCIDENTES",
        ramo: "Accidentes Personales",
        summary: "Cobertura ante accidentes que causen invalidez temporal, permanente o fallecimiento. Incluye gastos medicos por accidente y rehabilitacion.",
        keyFeatures: JSON.stringify(["Muerte accidental", "Invalidez permanente", "Invalidez temporal", "Gastos medicos", "Rehabilitacion"]),
        standardCoverages: JSON.stringify([
          { name: "Muerte accidental", limit: 30000000 },
          { name: "Invalidez permanente", limit: 30000000 },
          { name: "Gastos medicos", limit: 5000000 },
        ]),
        standardExclusions: JSON.stringify(["Deportes extremos sin declarar", "Autolesiones", "Intoxicacion voluntaria"]),
        typicalPremiumRange: JSON.stringify({ min: 8000, max: 25000, currency: "CLP", frequency: "MONTHLY" }),
        source: "CMF_DEPOSITO",
        isActive: true,
      },
      {
        cmfCode: "CMF-SOAP-001",
        insuranceCompany: "Liberty Seguros",
        productName: "SOAP - Seguro Obligatorio Accidentes Personales",
        category: "VEHICULO",
        ramo: "SOAP",
        summary: "Seguro obligatorio para vehiculos motorizados. Cubre gastos medicos, invalidez y muerte de ocupantes y terceros en accidentes de transito.",
        keyFeatures: JSON.stringify(["Gastos medicos accidente", "Invalidez", "Muerte", "Cobertura a terceros"]),
        standardCoverages: JSON.stringify([
          { name: "Gastos medicos", limit: 300, unitType: "UF" },
          { name: "Invalidez", limit: 300, unitType: "UF" },
          { name: "Muerte", limit: 300, unitType: "UF" },
        ]),
        standardExclusions: JSON.stringify([]),
        typicalPremiumRange: JSON.stringify({ min: 5000, max: 12000, currency: "CLP", frequency: "ANNUAL" }),
        source: "CMF_DEPOSITO",
        isActive: true,
      },
      {
        cmfCode: "CMF-VIA-001",
        insuranceCompany: "Assist Card",
        productName: "Seguro de Viaje Internacional",
        category: "VIAJE",
        ramo: "Viaje",
        summary: "Cobertura medica en el extranjero, repatriacion, perdida de equipaje, cancelacion de vuelos y asistencia 24/7.",
        keyFeatures: JSON.stringify(["Emergencia medica", "Repatriacion", "Equipaje", "Cancelacion", "Asistencia 24/7"]),
        standardCoverages: JSON.stringify([
          { name: "Emergencia medica", limit: 50000, unitType: "USD" },
          { name: "Repatriacion", limit: 30000, unitType: "USD" },
          { name: "Equipaje", limit: 1500, unitType: "USD" },
        ]),
        standardExclusions: JSON.stringify(["Deportes extremos", "Preexistencias", "Pandemias declaradas"]),
        typicalPremiumRange: JSON.stringify({ min: 20000, max: 80000, currency: "CLP", frequency: "PER_TRIP" }),
        source: "CMF_DEPOSITO",
        isActive: true,
      },
    ],
  });

  console.log("  Created 7 library entries");

  // ── Assign demo user to agent ──
  const agentProfile = await prisma.agentProfile.findUnique({ where: { userId: agent.id } });
  if (agentProfile) {
    await prisma.user.update({
      where: { id: demoUser.id },
      data: { assignedAgentId: agentProfile.id },
    });
    console.log("  Assigned demo user to agent");
  }

  console.log("\nSeed completed successfully!");
  console.log("\nCredentials:");
  console.log("  Admin:  admin@seguro360.cl / Admin123!");
  console.log("  Agent:  agente@seguro360.cl / Agent123!");
  console.log("  User:   demo@seguro360.cl / User1234!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
