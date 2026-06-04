import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

type RouteContext = { params: Promise<{ id: string }> };

const schema = z.object({ isAvailable: z.boolean() });

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { isAvailable } = schema.parse(body);

    const unit = await prisma.serviceUnit.update({
      where: { id },
      data: { isAvailable },
    });

    await writeAuditLog({
      userId: session.id,
      action: isAvailable ? "UNIT_OPENED" : "UNIT_CLOSED",
      targetType: "ServiceUnit",
      targetId: id,
      details: { unitName: unit.name },
    });

    return NextResponse.json({ data: unit });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    }
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
