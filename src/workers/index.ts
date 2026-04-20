/**
 * Document Processing Worker
 *
 * Consumes jobs from the BullMQ "document-processing" queue.
 * Pipeline: Download PDF → Extract text → Claude analysis → Save to DB
 *
 * Run with:  npm run worker
 *       or:  npm run dev:worker
 */

import "dotenv/config";
import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { QUEUES, type DocumentProcessingJobData } from "../lib/queue";
import { processDocument } from "./process-document";

const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || "3", 10);

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const worker = new Worker<DocumentProcessingJobData>(
  QUEUES.DOCUMENT_PROCESSING,
  async (job: Job<DocumentProcessingJobData>) => {
    const { documentId, fileName } = job.data;
    console.log(`[worker] Processing job ${job.id}: ${fileName} (doc: ${documentId})`);

    await processDocument(job.data, (progress: number, stage: string) => {
      job.updateProgress({ percent: progress, stage });
    });

    console.log(`[worker] Completed job ${job.id}: ${fileName}`);
  },
  {
    connection,
    concurrency: CONCURRENCY,
    limiter: {
      max: 5,
      duration: 60_000, // max 5 jobs per minute (Claude rate-limit safety)
    },
  },
);

worker.on("completed", (job) => {
  console.log(`[worker] Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("[worker] Worker error:", err);
});

console.log(
  `[worker] Document processing worker started (concurrency: ${CONCURRENCY})`,
);

// Graceful shutdown
async function shutdown() {
  console.log("[worker] Shutting down...");
  await worker.close();
  await connection.quit();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
