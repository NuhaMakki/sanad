import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "ADVISOR") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const advisor = await prisma.advisor.findUnique({ where: { userId: session.id } });
  if (!advisor) return NextResponse.json({ error: "لم يُعثر على المرشد" }, { status: 404 });

  const students = await prisma.student.findMany({
    where: { advisorId: advisor.id },
    include: {
      user: { select: { name: true } },
      riskScores: { orderBy: { calculatedAt: "desc" }, take: 1 },
    },
  });

  const highRiskCount = students.filter((s) => s.riskScores[0]?.level === "HIGH_RISK").length;
  const probableRiskCount = students.filter((s) => s.riskScores[0]?.level === "PROBABLE_RISK").length;
  const recentHighRisk = students
    .filter((s) => s.riskScores[0]?.level === "HIGH_RISK" || s.riskScores[0]?.level === "PROBABLE_RISK")
    .sort((a, b) => (b.riskScores[0]?.score ?? 0) - (a.riskScores[0]?.score ?? 0))
    .slice(0, 5);

  return NextResponse.json({
    data: { totalStudents: students.length, highRiskCount, probableRiskCount, recentHighRisk },
  });
}
