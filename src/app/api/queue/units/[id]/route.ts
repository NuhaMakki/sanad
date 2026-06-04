import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const unit = await prisma.serviceUnit.findUnique({
    where: { id },
    include: {
      issueTypes: true,
      staff: { include: { user: { select: { name: true } } } },
      _count: { select: { tickets: { where: { status: { in: ["WAITING", "SERVING"] } } } } },
    },
  });

  if (!unit) return NextResponse.json({ error: "الوحدة غير موجودة" }, { status: 404 });

  return NextResponse.json({ data: unit });
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const unit = await prisma.serviceUnit.update({
    where: { id },
    data: {
      isAvailable: body.isAvailable,
      description: body.description,
    },
  });

  return NextResponse.json({ data: unit });
}
