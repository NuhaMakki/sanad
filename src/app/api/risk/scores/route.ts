import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || !["ADVISOR", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const levelFilter = searchParams.get("level");

  let studentWhere = {};

  if (session.role === "ADVISOR") {
    const advisor = await prisma.advisor.findUnique({ where: { userId: session.id } });
    if (!advisor) return NextResponse.json({ data: [] });
    studentWhere = { advisorId: advisor.id };
  }

  const students = await prisma.student.findMany({
    where: studentWhere,
    include: {
      user: { select: { name: true } },
      college: { select: { name: true } },
      department: { select: { name: true } },
      riskScores: {
        orderBy: { calculatedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { warningCount: "desc" },
  });

  // Filter by risk level if specified
  const filtered = levelFilter
    ? students.filter((s) => s.riskScores[0]?.level === levelFilter)
    : students;

  return NextResponse.json({ data: filtered });
}
