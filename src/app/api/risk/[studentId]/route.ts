import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ studentId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const session = await getSessionFromRequest(request);
  if (!session || !["ADVISOR", "ADMIN", "STUDENT"].includes(session.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { studentId } = await params;

  if (session.role === "STUDENT") {
    const student = await prisma.student.findUnique({ where: { userId: session.id } });
    if (student?.id !== studentId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
  }

  const riskScores = await prisma.riskScore.findMany({
    where: { studentId },
    orderBy: { calculatedAt: "desc" },
    take: 5,
  });

  return NextResponse.json({ data: { latest: riskScores[0] ?? null, history: riskScores } });
}
