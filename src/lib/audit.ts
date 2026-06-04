import { prisma } from "@/lib/prisma";

export async function writeAuditLog(params: {
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: object;
  isAutomated?: boolean;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        details: JSON.stringify(params.details ?? {}),
        isAutomated: params.isAutomated ?? false,
      },
    });
  } catch {
    // Don't throw — audit log failure shouldn't break the operation
  }
}
