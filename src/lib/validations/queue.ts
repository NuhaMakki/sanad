import { z } from "zod";

export const createTicketSchema = z.object({
  serviceUnitId: z.string().min(1),
  issueTypeId: z.string().min(1),
  locationType: z.enum(["ONCAMPUS", "OFFCAMPUS"]),
  notes: z.string().max(500).optional().default(""),
  chatSummary: z.string().max(2000).optional().default(""),
});

export const updateTicketSchema = z.object({
  status: z.enum(["SERVING", "RESOLVED", "TRANSFERRED", "CANCELLED", "NO_SHOW"]).optional(),
  staffNotes: z.string().max(1000).optional(),
  staffMessage: z.string().max(500).optional(),
  transferToUnitId: z.string().optional(),
});

export const addTicketMessageSchema = z.object({
  content: z.string().min(1).max(1000),
  isInternal: z.boolean().optional().default(false),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
