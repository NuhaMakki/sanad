import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { writeAuditLog } from "@/lib/audit";

export type RiskLevel =
  | "SAFE"
  | "NORMAL"
  | "EARLY_RISK"
  | "PROBABLE_RISK"
  | "HIGH_RISK";

export function getRiskLevel(score: number): RiskLevel {
  if (score <= 25) return "SAFE";
  if (score <= 50) return "NORMAL";
  if (score <= 70) return "EARLY_RISK";
  if (score <= 85) return "PROBABLE_RISK";
  return "HIGH_RISK";
}

export function getRiskLevelArabic(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    SAFE: "في السليم",
    NORMAL: "عادي",
    EARLY_RISK: "بداية مؤشر خطر",
    PROBABLE_RISK: "خطر محتمل",
    HIGH_RISK: "خطر مرتفع",
  };
  return map[level];
}

export async function calculateRiskScore(
  studentId: string,
  systemUserId?: string
): Promise<{ score: number; level: RiskLevel }> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      academicRecords: {
        include: { course: true },
        orderBy: { semester: "desc" },
      },
      attendanceRecords: {
        include: { course: true },
        orderBy: { semester: "desc" },
      },
      queueTickets: {
        where: { status: { in: ["WAITING", "SERVING"] } },
      },
      riskScores: {
        orderBy: { calculatedAt: "desc" },
        take: 2,
      },
      advisor: true,
      user: { select: { name: true } },
    },
  });

  if (!student) return { score: 0, level: "SAFE" };

  let score = 0;
  const reasons: string[] = [];
  const recommendations: string[] = [];
  let factorCount = 0;

  // Get current and previous semester records
  const semesters = [
    ...new Set(student.attendanceRecords.map((r) => r.semester)),
  ].sort((a, b) => b.localeCompare(a));
  const currentSemester = semesters[0];

  const currentAttendance = student.attendanceRecords.filter(
    (r) => r.semester === currentSemester
  );

  // Attendance analysis (cap total contribution at 60)
  let attendanceScore = 0;
  for (const record of currentAttendance) {
    if (record.percentage < 25) {
      attendanceScore += 30;
      reasons.push(
        `غياب شديد في مادة ${record.course.name}: ${record.percentage.toFixed(0)}%`
      );
      factorCount++;
    } else if (record.percentage < 40) {
      attendanceScore += 20;
      reasons.push(
        `غياب مرتفع في مادة ${record.course.name}: ${record.percentage.toFixed(0)}%`
      );
      factorCount++;
    } else if (record.percentage < 75) {
      attendanceScore += 10;
      reasons.push(
        `غياب متوسط في مادة ${record.course.name}: ${record.percentage.toFixed(0)}%`
      );
    }
  }
  score += Math.min(attendanceScore, 60);

  // Grade analysis (cap at 40)
  const currentAcademic = student.academicRecords.filter(
    (r) => r.semester === currentSemester
  );
  let gradeScore = 0;
  for (const record of currentAcademic) {
    if (record.midtermGrade !== null && record.midtermGrade < 40) {
      gradeScore += 25;
      reasons.push(
        `درجة منخفضة في اختبار منتصف الفصل لمادة ${record.course.name}: ${record.midtermGrade.toFixed(0)}`
      );
      factorCount++;
    } else if (record.midtermGrade !== null && record.midtermGrade < 55) {
      gradeScore += 10;
      reasons.push(
        `أداء ضعيف في مادة ${record.course.name}: ${record.midtermGrade.toFixed(0)}`
      );
    }
  }
  score += Math.min(gradeScore, 40);

  // GPA analysis
  if (student.gpa < 1.5) {
    score += 35;
    reasons.push(`المعدل التراكمي منخفض جداً: ${student.gpa.toFixed(2)}`);
    recommendations.push("مراجعة عاجلة مع المرشد الأكاديمي");
    factorCount++;
  } else if (student.gpa < 2.0) {
    score += 20;
    reasons.push(`المعدل التراكمي ضعيف: ${student.gpa.toFixed(2)}`);
    recommendations.push("متابعة منتظمة مع المرشد الأكاديمي");
    factorCount++;
  }

  // GPA drop detection
  if (semesters.length >= 2 && student.riskScores.length >= 1) {
    const prevSemester = semesters[1];
    const prevAcademic = student.academicRecords.filter(
      (r) => r.semester === prevSemester && r.gradePercentage !== null
    );
    const currAcademic = student.academicRecords.filter(
      (r) => r.semester === currentSemester && r.gradePercentage !== null
    );
    if (prevAcademic.length > 0 && currAcademic.length > 0) {
      const prevAvg =
        prevAcademic.reduce((s, r) => s + (r.gradePercentage || 0), 0) /
        prevAcademic.length;
      const currAvg =
        currAcademic.reduce((s, r) => s + (r.gradePercentage || 0), 0) /
        currAcademic.length;
      if (prevAvg - currAvg > 20) {
        score += 20;
        reasons.push(
          `تراجع مفاجئ في الأداء الأكاديمي بمقدار ${(prevAvg - currAvg).toFixed(0)}%`
        );
        factorCount++;
      }
    }
  }

  // Graduating student with pending issues
  if (student.isGraduating && student.queueTickets.length > 0) {
    score += 15;
    reasons.push("طالب خريج لديه طلبات معلقة");
    recommendations.push("متابعة عاجلة لإنهاء إجراءات التخرج");
    factorCount++;
  }

  // Warning count
  if (student.warningCount >= 3) {
    score += 25;
    reasons.push(`إنذارات أكاديمية: ${student.warningCount}`);
    recommendations.push("تدخل عاجل من المرشد الأكاديمي");
    factorCount++;
  } else if (student.warningCount >= 2) {
    score += 15;
    reasons.push(`إنذارات أكاديمية: ${student.warningCount}`);
    factorCount++;
  }

  // Multiple factors bonus
  if (factorCount >= 2) {
    score += 10;
    reasons.push("تضافر عدة عوامل خطر");
  }

  score = Math.min(score, 100);
  const level = getRiskLevel(score);
  const previousScore = student.riskScores[0];
  const needsUrgentAction =
    level === "HIGH_RISK" ||
    (level === "PROBABLE_RISK" && student.warningCount >= 2);

  if (recommendations.length === 0) {
    if (level === "SAFE") recommendations.push("استمر في الأداء الجيد");
    else if (level === "NORMAL")
      recommendations.push("متابعة دورية للحضور والدرجات");
    else recommendations.push("التواصل مع المرشد الأكاديمي في أقرب وقت");
  }

  // Upsert risk score
  await prisma.riskScore.create({
    data: {
      studentId,
      score,
      level,
      reasons: JSON.stringify(reasons),
      recommendations: JSON.stringify(recommendations),
      needsUrgentAction,
    },
  });

  // Notify advisor if risk level increased to HIGH_RISK
  if (
    level === "HIGH_RISK" &&
    previousScore?.level !== "HIGH_RISK" &&
    student.advisor
  ) {
    await createNotification({
      userId: student.advisor.userId,
      type: "RISK_ALERT",
      title: "تنبيه: طالب في خطر مرتفع",
      body: `الطالب ${student.user?.name || studentId} وصل لمستوى خطر مرتفع (${score}/100)`,
      relatedEntityType: "STUDENT",
      relatedEntityId: studentId,
    });
  }

  if (systemUserId) {
    await writeAuditLog({
      userId: systemUserId,
      action: "RISK_SCORE_CALCULATED",
      targetType: "STUDENT",
      targetId: studentId,
      details: { score, level },
      isAutomated: true,
    });
  }

  return { score, level };
}
