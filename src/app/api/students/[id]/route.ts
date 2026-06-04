import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  if (session.role === "STUDENT") {
    const self = await prisma.student.findUnique({ where: { userId: session.id } });
    if (self?.id !== id) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, username: true, createdAt: true } },
      college: { select: { name: true } },
      department: { select: { name: true } },
      riskScores: { orderBy: { calculatedAt: "desc" }, take: 3 },
      academicRecords: { include: { course: true }, orderBy: { semester: "desc" } },
      attendanceRecords: { include: { course: true }, orderBy: { semester: "desc" } },
      advisorReports: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!student) return NextResponse.json({ error: "الطالب غير موجود" }, { status: 404 });

  return NextResponse.json({ data: student });
}
