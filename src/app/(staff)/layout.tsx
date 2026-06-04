"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageLoader } from "@/components/ui/Spinner";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "STAFF")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) return <PageLoader />;

  return (
    <DashboardLayout role="STAFF" name={user.name} title="قائمة الانتظار">
      {children}
    </DashboardLayout>
  );
}
