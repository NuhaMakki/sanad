import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const chatSession = await prisma.chatbotSession.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!chatSession) return NextResponse.json({ error: "الجلسة غير موجودة" }, { status: 404 });

  if (session.role === "STUDENT" && chatSession.userId !== session.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  return NextResponse.json({ data: chatSession });
}
