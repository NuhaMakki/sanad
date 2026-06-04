import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || !["ADVISOR", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  let where: Record<string, unknown> = {};

  if (session.role === "ADVISOR") {
    const advisor = await prisma.advisor.findUnique({ where: { userId: session.id } });
    if (!advisor) return NextResponse.json({ data: [] });
    where.advisorId = advisor.id;
  }

  if (search) {
    where = {
      ...where,
      OR: [
        { user: { name: { contains: search } } },
        { studentNumber: { contains: search } },
      ],
    };
  }

  const students = await prisma.student.findMany({
    where,
    include: {
      user: { select: { name: true, username: true } },
      college: { select: { name: true, code: true } },
      department: { select: { name: true, code: true } },
      riskScores: { orderBy: { calculatedAt: "desc" }, take: 1 },
      _count: {
        select: {
          queueTickets: { where: { status: { in: ["WAITING", "SERVING"] } } },
        },
      },
    },
    orderBy: { warningCount: "desc" },
  });

  return NextResponse.json({ data: students });
}
