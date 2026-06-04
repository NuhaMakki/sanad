import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

type RouteContext = { params: Promise<{ id: string }> };

const schema = z.object({ content: z.string().min(1).max(1000) });

export async function POST(request: NextRequest, { params }: RouteContext) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const ticket = await prisma.queueTicket.findUnique({
    where: { id },
    include: {
      student: { include: { user: true } },
      serviceUnit: { include: { staff: { include: { user: true } } } },
    },
  });

  if (!ticket) return NextResponse.json({ error: "لم يُعثر على الطلب" }, { status: 404 });

  const isStudent = session.role === "STUDENT" && ticket.student.userId === session.id;
  const isStaff = session.role === "STAFF" && ticket.serviceUnit.staff.some((s) => s.userId === session.id);
  const isAdmin = session.role === "ADMIN";

  if (!isStudent && !isStaff && !isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { content } = schema.parse(body);

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: session.id,
        content,
        isInternal: false,
      },
      include: { sender: { select: { name: true, role: true } } },
    });

    if (session.role === "STUDENT") {
      for (const staff of ticket.serviceUnit.staff) {
        await createNotification({
          userId: staff.userId,
          type: "TICKET_MESSAGE",
          title: "رسالة جديدة من طالب",
          body: content.slice(0, 80),
          relatedEntityType: "TICKET",
          relatedEntityId: id,
        });
      }
    } else {
      await createNotification({
        userId: ticket.student.userId,
        type: "STAFF_MESSAGE",
        title: "رسالة من الوحدة الخدمية",
        body: content.slice(0, 80),
        relatedEntityType: "TICKET",
        relatedEntityId: id,
      });
    }

    return NextResponse.json({ data: message }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    }
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
