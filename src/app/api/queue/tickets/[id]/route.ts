import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTicketSchema } from "@/lib/validations/queue";
import { writeAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const ticket = await prisma.queueTicket.findUnique({
    where: { id },
    include: {
      student: {
        include: {
          user: { select: { name: true } },
          riskScores: { orderBy: { calculatedAt: "desc" }, take: 1 },
        },
      },
      serviceUnit: {
        include: { staff: { include: { user: { select: { name: true } } } } },
      },
      issueType: true,
      messages: {
        where: session.role === "STUDENT" ? { isInternal: false } : {},
        include: { sender: { select: { name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!ticket) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

  if (session.role === "STUDENT") {
    const student = await prisma.student.findUnique({ where: { userId: session.id } });
    if (ticket.studentId !== student?.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    // Don't expose priorityScore to student
    const { priorityScore: _p, ...safeTicket } = ticket as typeof ticket & { priorityScore: number };
    return NextResponse.json({ data: safeTicket });
  }

  if (session.role === "STAFF") {
    const staff = await prisma.staff.findUnique({ where: { userId: session.id } });
    if (ticket.serviceUnitId !== staff?.serviceUnitId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
  }

  return NextResponse.json({ data: ticket });
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const session = await getSessionFromRequest(request);
  if (!session || !["STAFF", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data = updateTicketSchema.parse(body);

    const existing = await prisma.queueTicket.findUnique({
      where: { id },
      include: { student: { include: { user: true } } },
    });

    if (!existing) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (data.status) updateData.status = data.status;
    if (data.staffNotes !== undefined) updateData.staffNotes = data.staffNotes;
    if (data.status === "RESOLVED" || data.status === "CANCELLED" || data.status === "NO_SHOW") {
      updateData.resolvedAt = new Date();
    }

    const ticket = await prisma.queueTicket.update({
      where: { id },
      data: updateData,
    });

    await writeAuditLog({
      userId: session.id,
      action: `TICKET_${data.status ?? "UPDATED"}`,
      targetType: "QueueTicket",
      targetId: id,
      details: { previousStatus: existing.status, newStatus: data.status },
    });

    const statusMessages: Record<string, { title: string; body: string }> = {
      SERVING: { title: "حان دورك!", body: "يتم استدعاؤك الآن - يرجى التوجه للمسؤول" },
      RESOLVED: { title: "تم معالجة طلبك", body: "تمت معالجة طلبك بنجاح" },
      CANCELLED: { title: "تم إلغاء الطلب", body: "تم إلغاء طلبك" },
      NO_SHOW: { title: "تم تسجيل غيابك", body: "لم تحضر في الوقت المحدد" },
    };

    if (data.status && statusMessages[data.status]) {
      await createNotification({
        userId: existing.student.userId,
        type: "TICKET_STATUS_CHANGE",
        ...statusMessages[data.status],
        relatedEntityType: "QueueTicket",
        relatedEntityId: id,
      });
    }

    return NextResponse.json({ data: ticket });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "بيانات غير صحيحة", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
