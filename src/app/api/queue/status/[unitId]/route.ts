import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ unitId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { unitId } = await params;
  const { searchParams } = new URL(request.url);
  const ticketId = searchParams.get("ticketId");

  const waitingTickets = await prisma.queueTicket.findMany({
    where: { serviceUnitId: unitId, status: { in: ["WAITING", "SERVING"] } },
    select: { id: true, priorityScore: true, status: true, createdAt: true },
    orderBy: [{ priorityScore: "desc" }, { createdAt: "asc" }],
  });

  const unit = await prisma.serviceUnit.findUnique({
    where: { id: unitId },
    select: { name: true, isAvailable: true },
  });

  let position = 0;
  let etaMinutes = 0;

  if (ticketId) {
    const ticketIndex = waitingTickets.findIndex((t) => t.id === ticketId);
    if (ticketIndex >= 0) {
      const ticket = waitingTickets[ticketIndex];
      if (ticket.status === "SERVING") {
        position = 1;
        etaMinutes = 0;
      } else {
        position = waitingTickets.filter((_, i) => i < ticketIndex && waitingTickets[i].status === "WAITING").length + 1;
        etaMinutes = position * 10;
      }
    }
  }

  return NextResponse.json({
    data: {
      unitName: unit?.name,
      isAvailable: unit?.isAvailable,
      totalWaiting: waitingTickets.filter((t) => t.status === "WAITING").length,
      position,
      etaMinutes,
    },
  });
}
