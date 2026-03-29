import { z } from "zod";

export const sendMessageSchema = z.object({
  content: z.string().min(1, "El mensaje no puede estar vacio").max(4000),
});

export const createConversationSchema = z.object({
  title: z.string().max(200).optional(),
  initialMessage: z.string().min(1).max(4000).optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
