import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "ADVISOR") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const advisor = await prisma.advisor.findUnique({ where: { userId: session.id } });
  if (!advisor) return NextResponse.json({ error: "لم يُعثر على المرشد" }, { status: 404 });

  const reports = await prisma.advisorReport.findMany({
    where: { advisorId: advisor.id },
    include: {
      student: {
        select: {
          studentNumber: true,
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: reports });
}
