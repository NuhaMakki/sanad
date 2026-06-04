import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateRiskScore } from "@/lib/risk";

let isRecalculating = false;

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  if (isRecalculating) {
    return NextResponse.json({ error: "إعادة الحساب جارية بالفعل" }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));
  const { studentId } = body;

  isRecalculating = true;

  try {
    if (studentId) {
      const result = await calculateRiskScore(studentId, session.id);
      return NextResponse.json({ data: { updated: 1, result } });
    }

    const students = await prisma.student.findMany({ select: { id: true } });
    let updated = 0;

    for (const student of students) {
      await calculateRiskScore(student.id, session.id);
      updated++;
    }

    return NextResponse.json({ data: { updated } });
  } finally {
    isRecalculating = false;
  }
}
