import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      username: true,
      role: true,
      name: true,
      student: { select: { id: true, studentNumber: true, gpa: true, isGraduating: true, warningCount: true, collegeId: true, departmentId: true, advisorId: true } },
      advisor: { select: { id: true, collegeId: true, departmentId: true } },
      staff: { select: { id: true, serviceUnitId: true, isAvailable: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
  }

  return NextResponse.json({ data: user });
}
