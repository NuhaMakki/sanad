import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTicketSchema } from "@/lib/validations/queue";
import { calculatePriorityScore } from "@/lib/priority";
import { writeAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const statusFilter = status ? [status] : undefined;

  if (session.role === "STUDENT") {
    const student = await prisma.student.findUnique({ where: { userId: session.id } });
    if (!student) return NextResponse.json({ data: [] });

    const tickets = await prisma.queueTicket.findMany({
      where: {
        studentId: student.id,
        ...(statusFilter && { status: { in: statusFilter } }),
      },
      select: {
        id: true, status: true, locationType: true, notes: true, staffMessage: true,
        createdAt: true, updatedAt: true, resolvedAt: true, chatSummary: true,
        serviceUnit: { select: { id: true, name: true, type: true, isAvailable: true } },
        issueType: { select: { id: true, name: true, priority: true } },
        messages: {
          where: { isInternal: false },
          select: { id: true, content: true, createdAt: true, sender: { select: { name: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: tickets });
  }

  if (session.role === "STAFF") {
    const staff = await prisma.staff.findUnique({ where: { userId: session.id } });
    if (!staff) return NextResponse.json({ data: [] });

    const tickets = await prisma.queueTicket.findMany({
      where: {
        serviceUnitId: staff.serviceUnitId,
        ...(statusFilter
          ? { status: { in: statusFilter } }
          : { status: { in: ["WAITING", "SERVING"] } }),
      },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            riskScores: { orderBy: { calculatedAt: "desc" }, take: 1 },
          },
        },
        issueType: true,
        messages: {
          where: { isInternal: false },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: [{ priorityScore: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ data: tickets });
  }

  // ADMIN
  if (session.role === "ADMIN") {
    const tickets = await prisma.queueTicket.findMany({
      where: statusFilter ? { status: { in: statusFilter } } : {},
      include: {
        student: { include: { user: { select: { name: true } } } },
        serviceUnit: { select: { id: true, name: true } },
        issueType: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ data: tickets });
  }

  return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "STUDENT") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = createTicketSchema.parse(body);

    const student = await prisma.student.findUnique({
      where: { userId: session.id },
      include: {
        riskScores: { orderBy: { calculatedAt: "desc" }, take: 1 },
      },
    });

    if (!student) return NextResponse.json({ error: "الطالب غير موجود" }, { status: 404 });

    const issueType = await prisma.issueType.findUnique({ where: { id: data.issueTypeId } });
    if (!issueType) return NextResponse.json({ error: "نوع المشكلة غير موجود" }, { status: 404 });

    const riskLevel = student.riskScores[0]?.level ?? "SAFE";
    const priorityScore = calculatePriorityScore({
      isGraduating: student.isGraduating,
      warningCount: student.warningCount,
      riskLevel,
      locationType: data.locationType,
      issuePriority: issueType.priority,
    });

    const ticket = await prisma.queueTicket.create({
      data: {
        studentId: student.id,
        serviceUnitId: data.serviceUnitId,
        issueTypeId: data.issueTypeId,
        locationType: data.locationType,
        notes: data.notes ?? "",
        chatSummary: data.chatSummary ?? "",
        priorityScore,
        status: "WAITING",
      },
      include: {
        serviceUnit: { select: { name: true } },
        issueType: { select: { name: true } },
      },
    });

    await writeAuditLog({
      userId: session.id,
      action: "TICKET_CREATED",
      targetType: "TICKET",
      targetId: ticket.id,
      details: { serviceUnit: ticket.serviceUnit.name, issue: ticket.issueType.name },
    });

    // Notify staff
    const staffMembers = await prisma.staff.findMany({
      where: { serviceUnitId: data.serviceUnitId },
      include: { user: true },
    });

    for (const staffMember of staffMembers) {
      await createNotification({
        userId: staffMember.userId,
        type: "NEW_TICKET",
        title: "طلب جديد في الطابور",
        body: `طلب جديد: ${issueType.name} - الأولوية: ${priorityScore}`,
        relatedEntityType: "TICKET",
        relatedEntityId: ticket.id,
      });
    }

    return NextResponse.json({ data: ticket }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "بيانات غير صحيحة", issues: error.issues }, { status: 400 });
    }
    console.error("Create ticket error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
