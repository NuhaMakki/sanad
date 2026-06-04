import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reportTemplateSchema } from "@/lib/validations/admin";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || !["ADVISOR", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const templates = await prisma.reportTemplate.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: templates });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = reportTemplateSchema.parse(body);

    const template = await prisma.reportTemplate.create({
      data: { ...data, createdBy: session.id },
    });

    return NextResponse.json({ data: template }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    }
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
