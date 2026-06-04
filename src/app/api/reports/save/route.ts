import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "ADVISOR") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const body = await request.json();
  const { studentId, content, title } = body;

  if (!studentId || !content) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  const advisor = await prisma.advisor.findUnique({ where: { userId: session.id } });
  if (!advisor) return NextResponse.json({ error: "المرشد غير موجود" }, { status: 404 });

  const report = await prisma.advisorReport.create({
    data: {
      advisorId: advisor.id,
      studentId,
      type: "AI_GENERATED",
      content,
      isAiGenerated: true,
    },
  });

  await writeAuditLog({
    userId: session.id,
    action: "REPORT_CREATED",
    targetType: "Student",
    targetId: studentId,
    details: { isAiGenerated: true, title: title ?? "تقرير أكاديمي" },
  });

  return NextResponse.json({ data: report }, { status: 201 });
}
