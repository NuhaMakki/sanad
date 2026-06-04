import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatWithAI } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "ADVISOR") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const body = await request.json();
  const { studentId } = body;

  if (!studentId) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { name: true } },
      college: { select: { name: true } },
      department: { select: { name: true } },
      riskScores: { orderBy: { calculatedAt: "desc" }, take: 1 },
      academicRecords: { include: { course: true }, orderBy: { semester: "desc" }, take: 10 },
      attendanceRecords: { include: { course: true }, orderBy: { semester: "desc" }, take: 10 },
    },
  });

  if (!student) return NextResponse.json({ error: "الطالب غير موجود" }, { status: 404 });

  const riskScore = student.riskScores[0];
  let reasons: string[] = [];
  let recommendations: string[] = [];
  try {
    reasons = JSON.parse(riskScore?.reasons ?? "[]");
    recommendations = JSON.parse(riskScore?.recommendations ?? "[]");
  } catch { /* ignore */ }

  const attendanceSummary = student.attendanceRecords.slice(0, 5)
    .map((r) => `${r.course.name}: ${r.percentage.toFixed(0)}% حضور`)
    .join("، ");

  const gradesSummary = student.academicRecords.slice(0, 5)
    .map((r) => `${r.course.name}: ${r.midtermGrade?.toFixed(0) ?? "—"} (وسط)`)
    .join("، ");

  const prompt = `اكتب تقريراً إرشادياً أكاديمياً مفصلاً للطالب التالي:

الاسم: ${student.user.name}
الرقم الجامعي: ${student.studentNumber}
الكلية: ${student.college.name}
القسم: ${student.department.name}
المعدل التراكمي: ${student.gpa}
عدد الإنذارات: ${student.warningCount}
طالب خريج: ${student.isGraduating ? "نعم" : "لا"}

درجة الخطر الأكاديمي: ${riskScore?.score ?? 0}/100 (${riskScore?.level ?? "SAFE"})
أسباب الخطر: ${reasons.join("، ") || "لا توجد"}

ملخص الحضور: ${attendanceSummary || "لا توجد بيانات"}
ملخص الدرجات: ${gradesSummary || "لا توجد بيانات"}

التوصيات المقترحة: ${recommendations.join("، ") || "لا توجد"}

اكتب التقرير باللغة العربية الرسمية بشكل منظم وشامل يتضمن: الوضع الحالي، التحليل، التوصيات، خطة المتابعة.`;

  const content = await chatWithAI([{ role: "user", content: prompt }], "REPORT");

  return NextResponse.json({ data: { content, studentId } });
}
