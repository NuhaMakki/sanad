import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const COOKIE_NAME = "sanad-auth";

const ROLE_REDIRECTS: Record<string, string> = {
  STUDENT: "/student/dashboard",
  ADVISOR: "/advisor/dashboard",
  STAFF: "/staff/dashboard",
  ADMIN: "/admin/dashboard",
};

const PROTECTED_PATTERNS = [
  { prefix: "/student", role: "STUDENT" },
  { prefix: "/advisor", role: "ADVISOR" },
  { prefix: "/staff", role: "STAFF" },
  { prefix: "/admin", role: "ADMIN" },
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login" || pathname === "/") {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (token) {
      const session = await verifyToken(token);
      if (session) {
        const redirect = ROLE_REDIRECTS[session.role];
        if (redirect) {
          return NextResponse.redirect(new URL(redirect, request.url));
        }
      }
    }
    return NextResponse.next();
  }

  const matchedPattern = PROTECTED_PATTERNS.find((p) =>
    pathname.startsWith(p.prefix)
  );

  if (!matchedPattern) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const session = await verifyToken(token);
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session.role !== matchedPattern.role) {
    const correctRedirect = ROLE_REDIRECTS[session.role];
    if (correctRedirect) {
      return NextResponse.redirect(new URL(correctRedirect, request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/student/:path*",
    "/advisor/:path*",
    "/staff/:path*",
    "/admin/:path*",
  ],
};
