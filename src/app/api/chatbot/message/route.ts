import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatMessageSchema } from "@/lib/validations/chatbot";
import { chatWithAI } from "@/lib/openrouter";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60 * 1000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "STUDENT") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  if (!checkRateLimit(session.id)) {
    return NextResponse.json(
      { error: "تجاوزت الحد المسموح من الرسائل. يرجى الانتظار دقيقة." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { message, sessionId, context, ticketId } = chatMessageSchema.parse(body);

    let chatSession = sessionId
      ? await prisma.chatbotSession.findUnique({ where: { id: sessionId } })
      : null;

    if (!chatSession) {
      chatSession = await prisma.chatbotSession.create({
        data: { userId: session.id, context, ticketId },
      });
    }

    await prisma.chatbotMessage.create({
      data: { sessionId: chatSession.id, role: "USER", content: message },
    });

    const history = await prisma.chatbotMessage.findMany({
      where: { sessionId: chatSession.id },
      orderBy: { createdAt: "asc" },
      take: 10,
    });

    const aiReply = await chatWithAI(
      history.map((m) => ({ role: m.role.toLowerCase() as "user" | "assistant", content: m.content })),
      context as "QUEUE" | "GENERAL"
    );

    await prisma.chatbotMessage.create({
      data: { sessionId: chatSession.id, role: "ASSISTANT", content: aiReply },
    });

    // Generate summary after 4+ turns for QUEUE context
    let summary: string | null = null;
    if (context === "QUEUE" && history.length >= 4) {
      const userMessages = history.filter((m) => m.role === "USER").map((m) => m.content).join(" | ");
      summary = userMessages.slice(0, 200);
    }

    return NextResponse.json({
      data: { sessionId: chatSession.id, reply: aiReply, summary },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    }
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
