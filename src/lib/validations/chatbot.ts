import { z } from "zod";

export const chatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().optional(),
  context: z.enum(["QUEUE", "GENERAL"]).default("GENERAL"),
  ticketId: z.string().optional(),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
