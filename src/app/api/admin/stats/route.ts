import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const [
    totalStudents,
    activeTickets,
    resolvedToday,
    highRiskCount,
    probableRiskCount,
    earlyRiskCount,
    normalCount,
    safeCount,
    unitStats,
    issueCounts,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.queueTicket.count({ where: { status: { in: ["WAITING", "SERVING"] } } }),
    prisma.queueTicket.count({
      where: {
        status: "RESOLVED",
        resolvedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.riskScore.count({
      where: { level: "HIGH_RISK", calculatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.riskScore.count({
      where: { level: "PROBABLE_RISK", calculatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.riskScore.count({
      where: { level: "EARLY_RISK", calculatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.riskScore.count({
      where: { level: "NORMAL", calculatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.riskScore.count({
      where: { level: "SAFE", calculatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.serviceUnit.findMany({
      select: {
        id: true,
        name: true,
        isAvailable: true,
        _count: { select: { tickets: { where: { status: { in: ["WAITING", "SERVING"] } } } } },
      },
    }),
    prisma.issueType.findMany({
      select: {
        name: true,
        _count: { select: { tickets: true } },
      },
      orderBy: { tickets: { _count: "desc" } },
      take: 10,
    }),
  ]);

  return NextResponse.json({
    data: {
      totalStudents,
      activeTickets,
      resolvedToday,
      riskDistribution: {
        HIGH_RISK: highRiskCount,
        PROBABLE_RISK: probableRiskCount,
        EARLY_RISK: earlyRiskCount,
        NORMAL: normalCount,
        SAFE: safeCount,
      },
      unitStats: unitStats.map((u) => ({
        id: u.id,
        name: u.name,
        isAvailable: u.isAvailable,
        activeTickets: u._count.tickets,
      })),
      topIssues: issueCounts.map((i) => ({
        name: i.name,
        count: i._count.tickets,
      })),
    },
  });
}
