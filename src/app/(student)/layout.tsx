"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageLoader } from "@/components/ui/Spinner";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/student/dashboard": "لوحة التحكم",
  "/student/queue/new": "حجز خدمة جديدة",
  "/student/chat": "المساعد الذكي",
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== "STUDENT")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) return <PageLoader />;

  const title = pathname.startsWith("/student/queue/")
    ? pathname === "/student/queue/new" ? "حجز خدمة جديدة" : "تفاصيل الطلب"
    : PAGE_TITLES[pathname] ?? "سند";

  return (
    <DashboardLayout role="STUDENT" name={user.name} title={title}>
      {children}
    </DashboardLayout>
  );
}
