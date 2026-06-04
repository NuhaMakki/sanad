import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "STUDENT") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.id },
    include: {
      department: { select: { name: true } },
      riskScores: { orderBy: { calculatedAt: "desc" }, take: 1 },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "لم يُعثر على الطالب" }, { status: 404 });
  }

  const activeTicket = await prisma.queueTicket.findFirst({
    where: { studentId: student.id, status: { in: ["WAITING", "SERVING"] } },
    select: {
      id: true, status: true, createdAt: true,
      serviceUnit: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    data: {
      student: {
        studentNumber: student.studentNumber,
        gpa: student.gpa,
        warningCount: student.warningCount,
        isGraduating: student.isGraduating,
        department: student.department,
      },
      riskScore: student.riskScores[0] ?? null,
      activeTicket,
    },
  });
}
