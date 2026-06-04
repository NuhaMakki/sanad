import { z } from "zod";

export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  name: z.string().min(2).max(100),
  role: z.enum(["STUDENT", "ADVISOR", "STAFF", "ADMIN"]),
  studentNumber: z.string().optional(),
  collegeId: z.string().optional(),
  departmentId: z.string().optional(),
  advisorId: z.string().optional(),
  serviceUnitId: z.string().optional(),
  year: z.number().int().min(1).max(10).optional(),
  isGraduating: z.boolean().optional(),
});

export const updateServiceUnitSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  isAvailable: z.boolean().optional(),
  description: z.string().max(500).optional(),
  officeHours: z.string().optional(),
});

export const priorityRuleSchema = z.object({
  name: z.string().min(2).max(100),
  condition: z.string().min(1),
  scoreAdjustment: z.number().int().min(-50).max(50),
  isActive: z.boolean().default(true),
  description: z.string().max(500).optional().default(""),
});

export const knowledgeSourceSchema = z.object({
  title: z.string().min(2).max(200),
  content: z.string().min(10),
  category: z.string().min(1).max(50),
});

export const reportTemplateSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.string().min(1).max(50),
  content: z.string().min(10),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
