import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  await prisma.notification.updateMany({
    where: { userId: session.id, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ data: { success: true } });
}
