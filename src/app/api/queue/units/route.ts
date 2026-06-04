import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const units = await prisma.serviceUnit.findMany({
    include: {
      issueTypes: { select: { id: true, name: true, priority: true, description: true } },
      _count: { select: { tickets: { where: { status: { in: ["WAITING", "SERVING"] } } } } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: units });
}
