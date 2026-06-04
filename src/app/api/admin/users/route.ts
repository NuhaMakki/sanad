import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createUserSchema } from "@/lib/validations/admin";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");

  const users = await prisma.user.findMany({
    where: role ? { role } : {},
    select: {
      id: true, username: true, name: true, role: true, createdAt: true,
      student: { select: { id: true, studentNumber: true, gpa: true } },
      advisor: { select: { id: true } },
      staff: { select: { id: true, serviceUnitId: true, isAvailable: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: users });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = createUserSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { username: data.username } });
    if (existing) {
      return NextResponse.json({ error: "اسم المستخدم مستخدم بالفعل" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        passwordHash,
        role: data.role,
        name: data.name,
      },
    });

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "بيانات غير صحيحة", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
