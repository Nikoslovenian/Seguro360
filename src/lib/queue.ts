import { Queue } from "bullmq";
import { getRedisConnection } from "./redis";

export const QUEUES = {
  DOCUMENT_PROCESSING: "document-processing",
} as const;

const queueInstances = new Map<string, Queue>();

export function getQueue(name: string): Queue {
  if (!queueInstances.has(name)) {
    queueInstances.set(
      name,
      new Queue(name, {
        connection: getRedisConnection(),
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 50 },
        },
      }),
    );
  }
  return queueInstances.get(name)!;
}

export interface DocumentProcessingJobData {
  documentId: string;
  userId: string;
  fileName: string;
  fileType: string;
  storagePath: string;
  storageBucket: string;
}

export async function enqueueDocumentProcessing(data: DocumentProcessingJobData) {
  const queue = getQueue(QUEUES.DOCUMENT_PROCESSING);
  return queue.add("process-document", data, {
    priority: 1,
  });
}
