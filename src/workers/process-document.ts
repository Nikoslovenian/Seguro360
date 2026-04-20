/**
 * Document processing pipeline.
 *
 * Steps:
 *   1. Download file from S3
 *   2. Extract raw text (pdf-parse for PDFs, Claude vision for images)
 *   3. Send to Claude for structured extraction
 *   4. Persist extracted policy + coverages + exclusions + chunks to DB
 *   5. Mark document as COMPLETED
 */

import { PrismaClient } from "@prisma/client";
import type { DocumentProcessingJobData } from "../lib/queue";
import { downloadFile } from "../lib/s3";
import { extractText } from "./extract-text";
import { extractPolicyWithClaude, type ExtractedPolicy } from "./extract-policy";
import { createChunks } from "./chunker";

const prisma = new PrismaClient();

type ProgressCallback = (percent: number, stage: string) => void;

export async function processDocument(
  data: DocumentProcessingJobData,
  onProgress: ProgressCallback,
): Promise<void> {
  const { documentId, storagePath, storageBucket, fileType, fileName } = data;

  try {
    // ── Step 1: Download from S3 ──────────────────────────────────────
    onProgress(5, "Descargando archivo");
    await updateStatus(documentId, "EXTRACTING_TEXT");

    const fileBuffer = await downloadFile(storageBucket, storagePath);
    console.log(`[process] Downloaded ${fileName} (${(fileBuffer.length / 1024).toFixed(0)} KB)`);

    // ── Step 2: Extract raw text ──────────────────────────────────────
    onProgress(15, "Extrayendo texto");

    const isImage = /^image\//i.test(fileType);
    const textResult = await extractText(fileBuffer, fileType);

    await prisma.policyDocument.update({
      where: { id: documentId },
      data: {
        extractedText: textResult.text,
        pageCount: textResult.pageCount,
        isScanned: textResult.isScanned,
        textExtractionMethod: textResult.method,
      },
    });

    console.log(
      `[process] Text extracted: ${textResult.text.length} chars, ${textResult.pageCount} pages (${textResult.method})`,
    );

    // If we got no usable text, mark as needing review
    if (textResult.text.trim().length < 50) {
      await updateStatus(documentId, "NEEDS_REVIEW", "No se pudo extraer texto suficiente del documento");
      return;
    }

    // ── Step 3: Claude structured extraction ──────────────────────────
    onProgress(35, "Analizando con IA");
    await updateStatus(documentId, "EXTRACTING_STRUCTURED" as string);

    const extracted = await extractPolicyWithClaude(
      textResult.text,
      fileName,
      isImage ? fileBuffer : undefined,
      isImage ? fileType : undefined,
    );

    console.log(
      `[process] Claude extraction: company=${extracted.insuranceCompany}, category=${extracted.category}, ` +
      `coverages=${extracted.coverages.length}, exclusions=${extracted.exclusions.length}`,
    );

    onProgress(70, "Guardando datos");

    // ── Step 4: Persist to database ───────────────────────────────────
    await persistExtraction(documentId, data.userId, extracted);

    // ── Step 5: Create chunks for RAG ─────────────────────────────────
    onProgress(85, "Indexando para busqueda");
    await updateStatus(documentId, "GENERATING_EMBEDDINGS" as string);

    const chunks = createChunks(textResult.text, { maxTokens: 512, overlap: 64 });

    if (chunks.length > 0) {
      await prisma.documentChunk.createMany({
        data: chunks.map((chunk, i) => ({
          documentId,
          userId: data.userId,
          content: chunk.content,
          chunkIndex: i,
          pageNumber: chunk.pageNumber,
          section: chunk.section,
          tokenCount: chunk.tokenCount,
        })),
      });
      console.log(`[process] Created ${chunks.length} chunks for RAG`);
    }

    // ── Done ──────────────────────────────────────────────────────────
    onProgress(100, "Completado");
    await updateStatus(documentId, "COMPLETED");
    console.log(`[process] Document ${documentId} processed successfully`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error(`[process] Failed to process ${documentId}:`, message);
    await updateStatus(documentId, "FAILED", message);
    throw error; // re-throw so BullMQ can retry
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────

async function updateStatus(id: string, status: string, error?: string) {
  const data: Record<string, unknown> = { processingStatus: status };

  if (status === "EXTRACTING_TEXT") {
    data.processingStartedAt = new Date();
  }
  if (status === "COMPLETED") {
    data.processingCompletedAt = new Date();
    data.processingError = null;
  }
  if (status === "FAILED" || status === "NEEDS_REVIEW") {
    data.processingCompletedAt = new Date();
    if (error) data.processingError = error;
  }

  await prisma.policyDocument.update({ where: { id }, data });
}

async function persistExtraction(
  documentId: string,
  userId: string,
  extracted: ExtractedPolicy,
) {
  // Create or update the InsurancePolicy
  const policy = await prisma.insurancePolicy.create({
    data: {
      userId,
      sourceDocumentId: documentId,
      policyNumber: extracted.policyNumber,
      depositCode: extracted.depositCode,
      insuranceCompany: extracted.insuranceCompany,
      category: extracted.category,
      subcategory: extracted.subcategory,
      ramo: extracted.ramo,
      policyHolder: extracted.policyHolder,
      insuredName: extracted.insuredName,
      insuredRut: extracted.insuredRut,
      startDate: extracted.startDate ? new Date(extracted.startDate) : null,
      endDate: extracted.endDate ? new Date(extracted.endDate) : null,
      premium: extracted.premium,
      premiumCurrency: extracted.premiumCurrency ?? "CLP",
      premiumFrequency: extracted.premiumFrequency,
      totalInsuredAmount: extracted.totalInsuredAmount,
      status: "PENDING_VERIFICATION",
      source: "DOCUMENT_UPLOAD",
      overallConfidence: extracted.overallConfidence,
      rawExtraction: JSON.stringify(extracted),
      extractionModel: "claude-sonnet-4-20250514",
      extractedAt: new Date(),
    },
  });

  // Coverages
  if (extracted.coverages.length > 0) {
    await prisma.coverage.createMany({
      data: extracted.coverages.map((c) => ({
        policyId: policy.id,
        name: c.name,
        description: c.description,
        category: c.category,
        coveredAmount: c.coveredAmount,
        coveredPercent: c.coveredPercent,
        currency: c.currency ?? "CLP",
        limitPerEvent: c.limitPerEvent,
        limitAnnual: c.limitAnnual,
        confidence: c.confidence,
        sourceText: c.sourceText,
        sourceAttribution: "LLM_EXTRACTION",
      })),
    });
  }

  // Exclusions
  if (extracted.exclusions.length > 0) {
    await prisma.exclusion.createMany({
      data: extracted.exclusions.map((e) => ({
        policyId: policy.id,
        description: e.description,
        category: e.category,
        isAbsolute: e.isAbsolute ?? true,
        confidence: e.confidence,
        sourceText: e.sourceText,
        sourceAttribution: "LLM_EXTRACTION",
      })),
    });
  }

  // Deductibles
  if (extracted.deductibles.length > 0) {
    await prisma.deductible.createMany({
      data: extracted.deductibles.map((d) => ({
        policyId: policy.id,
        name: d.name,
        amount: d.amount,
        percentage: d.percentage,
        currency: d.currency ?? "CLP",
        appliesTo: d.appliesTo,
        frequency: d.frequency,
        confidence: d.confidence,
        sourceText: d.sourceText,
        sourceAttribution: "LLM_EXTRACTION",
      })),
    });
  }

  // Beneficiaries
  if (extracted.beneficiaries.length > 0) {
    await prisma.beneficiary.createMany({
      data: extracted.beneficiaries.map((b) => ({
        policyId: policy.id,
        name: b.name,
        rut: b.rut,
        relationship: b.relationship,
        percentage: b.percentage,
        isContingent: b.isContingent ?? false,
        confidence: b.confidence,
        sourceAttribution: "LLM_EXTRACTION",
      })),
    });
  }

  console.log(
    `[process] Created policy ${policy.id} with ` +
    `${extracted.coverages.length} coverages, ${extracted.exclusions.length} exclusions, ` +
    `${extracted.deductibles.length} deductibles, ${extracted.beneficiaries.length} beneficiaries`,
  );

  return policy;
}
