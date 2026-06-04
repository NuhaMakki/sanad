"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageLoader } from "@/components/ui/Spinner";

const PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard": "لوحة التحكم",
  "/admin/users": "إدارة المستخدمين",
  "/admin/units": "الوحدات الخدمية",
  "/admin/settings": "إعدادات النظام",
  "/admin/audit": "سجل الأحداث",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) return <PageLoader />;

  return (
    <DashboardLayout role="ADMIN" name={user.name} title={PAGE_TITLES[pathname] ?? "الإدارة"}>
      {children}
    </DashboardLayout>
  );
}
