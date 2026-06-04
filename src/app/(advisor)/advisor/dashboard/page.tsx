"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { RiskBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";

interface AdvisorStats {
  totalStudents: number;
  highRiskCount: number;
  probableRiskCount: number;
  recentHighRisk: {
    id: string;
    studentNumber: string;
    user: { name: string };
    riskScores: { score: number; level: string }[];
  }[];
}

export default function AdvisorDashboard() {
  const [stats, setStats] = useState<AdvisorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/advisor/stats")
      .then((r) => r.json())
      .then((d) => setStats(d.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (!stats) return <p className="text-gray-500">تعذّر تحميل البيانات.</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<Users className="h-6 w-6 text-navy-600" />} label="إجمالي الطلاب" value={stats.totalStudents} color="bg-navy-50" />
        <StatCard icon={<AlertTriangle className="h-6 w-6 text-red-500" />} label="خطر مرتفع" value={stats.highRiskCount} color="bg-red-50" />
        <StatCard icon={<TrendingUp className="h-6 w-6 text-amber-500" />} label="خطر محتمل" value={stats.probableRiskCount} color="bg-amber-50" />
      </div>

      {stats.highRiskCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>طلاب يحتاجون تدخلاً عاجلاً</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {stats.recentHighRisk.map((student) => {
              const risk = student.riskScores[0];
              return (
                <Link
                  key={student.id}
                  href={`/advisor/students/${student.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-navy-900">{student.user.name}</p>
                    <p className="text-xs text-gray-500">{student.studentNumber}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {risk && <span className="text-sm font-bold text-red-600">{risk.score}/100</span>}
                    {risk && <RiskBadge level={risk.level} />}
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-4 border-t pt-4">
            <Link href="/advisor/students" className="text-sm text-teal-600 hover:underline">
              عرض كل الطلاب
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl border border-gray-200 p-5 ${color}`}>
      <div className="flex items-center gap-3 mb-3">{icon}<span className="text-sm font-medium text-gray-600">{label}</span></div>
      <p className="text-3xl font-bold text-navy-900">{value}</p>
    </div>
  );
}
