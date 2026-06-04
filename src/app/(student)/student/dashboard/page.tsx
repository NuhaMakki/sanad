"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Ticket, MessageSquare, AlertTriangle, BookOpen, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TicketStatusBadge, RiskBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";

interface StudentData {
  student: {
    studentNumber: string;
    gpa: number;
    warningCount: number;
    isGraduating: boolean;
    department: { name: string };
  };
  riskScore: { score: number; level: string } | null;
  activeTicket: {
    id: string;
    status: string;
    serviceUnit: { name: string };
    createdAt: string;
  } | null;
}

export default function StudentDashboard() {
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/students/me")
      .then((r) => r.json())
      .then((d) => setData(d.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (!data) return <p className="text-gray-500">تعذّر تحميل البيانات.</p>;

  const { student, riskScore, activeTicket } = data;

  return (
    <div className="space-y-6">
      {/* Risk Warning */}
      {riskScore && (riskScore.level === "HIGH_RISK" || riskScore.level === "PROBABLE_RISK") && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-800 text-sm">تنبيه أكاديمي</p>
            <p className="text-sm text-red-700 mt-1">
              يشير سجلك الأكاديمي إلى بعض المؤشرات التي تستدعي الانتباه. يُنصح بالتواصل مع مرشدك الأكاديمي.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={<TrendingUp className="h-5 w-5 text-navy-600" />} label="المعدل التراكمي" value={student.gpa.toFixed(2)} />
        <StatCard icon={<BookOpen className="h-5 w-5 text-teal-600" />} label="القسم" value={student.department.name} small />
        <StatCard icon={<AlertTriangle className="h-5 w-5 text-amber-500" />} label="الإنذارات" value={String(student.warningCount)} />
        {riskScore && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
            <p className="text-xs text-gray-500">مستوى الخطر</p>
            <RiskBadge level={riskScore.level} />
          </div>
        )}
      </div>

      {/* Active Ticket */}
      {activeTicket && (
        <Card>
          <CardHeader>
            <CardTitle>الطلب النشط</CardTitle>
          </CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-navy-900">{activeTicket.serviceUnit.name}</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {new Date(activeTicket.createdAt).toLocaleDateString("ar-SA")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <TicketStatusBadge status={activeTicket.status} />
              <Link href={`/student/queue/${activeTicket.id}`}>
                <Button size="sm" variant="outline">متابعة</Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardTitle className="mb-4">الخدمات المتاحة</CardTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/student/queue/new">
            <button className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-navy-200 hover:border-navy-400 hover:bg-navy-50 transition-colors text-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-100">
                <Ticket className="h-6 w-6 text-navy-700" />
              </div>
              <div>
                <p className="font-semibold text-navy-900">حجز خدمة</p>
                <p className="text-xs text-gray-500">تقديم طلب للوحدات الخدمية</p>
              </div>
            </button>
          </Link>
          <Link href="/student/chat">
            <button className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-teal-200 hover:border-teal-400 hover:bg-teal-50 transition-colors text-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100">
                <MessageSquare className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <p className="font-semibold text-navy-900">المساعد الذكي</p>
                <p className="text-xs text-gray-500">أسئلة وإجابات جامعية</p>
              </div>
            </button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, small }: { icon: React.ReactNode; label: string; value: string; small?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {icon}
        {label}
      </div>
      <p className={`font-bold text-navy-900 ${small ? "text-sm" : "text-2xl"} mt-1`}>{value}</p>
    </div>
  );
}
