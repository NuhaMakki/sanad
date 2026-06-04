"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageLoader } from "@/components/ui/Spinner";

const PAGE_TITLES: Record<string, string> = {
  "/advisor/dashboard": "لوحة التحكم",
  "/advisor/students": "قائمة الطلاب",
  "/advisor/reports": "التقارير",
};

export default function AdvisorLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADVISOR")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) return <PageLoader />;

  const title = pathname.startsWith("/advisor/students/")
    ? "ملف الطالب"
    : PAGE_TITLES[pathname] ?? "سند";

  return (
    <DashboardLayout role="ADVISOR" name={user.name} title={title}>
      {children}
    </DashboardLayout>
  );
}
