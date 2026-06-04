"use client";

import { useEffect, useState } from "react";
import { Users, Ticket, CheckCircle, AlertTriangle, Building2 } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";

interface StatsData {
  totalStudents: number;
  activeTickets: number;
  resolvedToday: number;
  riskDistribution: Record<string, number>;
  unitStats: { id: string; name: string; isAvailable: boolean; activeTickets: number }[];
  topIssues: { name: string; count: number }[];
}

const RISK_COLORS: Record<string, string> = {
  SAFE: "#22c55e",
  NORMAL: "#94a3b8",
  EARLY_RISK: "#3b82f6",
  PROBABLE_RISK: "#f59e0b",
  HIGH_RISK: "#ef4444",
};

const RISK_LABELS: Record<string, string> = {
  SAFE: "آمن",
  NORMAL: "عادي",
  EARLY_RISK: "خطر مبكر",
  PROBABLE_RISK: "خطر محتمل",
  HIGH_RISK: "خطر مرتفع",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => setStats(d.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (!stats) return <p className="text-gray-500">تعذّر تحميل البيانات.</p>;

  const riskData = Object.entries(stats.riskDistribution).map(([level, count]) => ({
    name: RISK_LABELS[level] ?? level,
    value: count,
    color: RISK_COLORS[level] ?? "#94a3b8",
  }));

  const topIssuesData = stats.topIssues.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="h-6 w-6 text-navy-600" />} label="إجمالي الطلاب" value={stats.totalStudents} color="bg-navy-50" />
        <StatCard icon={<Ticket className="h-6 w-6 text-amber-500" />} label="طلبات نشطة" value={stats.activeTickets} color="bg-amber-50" />
        <StatCard icon={<CheckCircle className="h-6 w-6 text-green-500" />} label="أُنجز اليوم" value={stats.resolvedToday} color="bg-green-50" />
        <StatCard icon={<AlertTriangle className="h-6 w-6 text-red-500" />} label="خطر مرتفع" value={stats.riskDistribution["HIGH_RISK"] ?? 0} color="bg-red-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Pie */}
        <Card>
          <CardHeader><CardTitle>توزيع مستويات الخطر</CardTitle></CardHeader>
          <div dir="ltr" className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {riskData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v, "طالب"]} />
                <Legend formatter={(v) => v} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Issues Bar */}
        <Card>
          <CardHeader><CardTitle>أكثر أنواع المشاكل طلباً</CardTitle></CardHeader>
          <div dir="ltr" className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topIssuesData} layout="vertical" margin={{ right: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1e3a8a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Unit stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-teal-500" />
            <CardTitle>حالة الوحدات الخدمية</CardTitle>
          </div>
        </CardHeader>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.unitStats.map((unit) => (
            <div
              key={unit.id}
              className={`rounded-xl p-3 border ${unit.isAvailable ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}
            >
              <p className="text-xs font-medium text-gray-700 truncate">{unit.name}</p>
              <p className="text-lg font-bold text-navy-900 mt-1">{unit.activeTickets}</p>
              <p className="text-xs text-gray-500">طلب نشط</p>
              <span className={`text-xs font-medium ${unit.isAvailable ? "text-green-600" : "text-gray-500"}`}>
                {unit.isAvailable ? "مفتوح" : "مغلق"}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl border border-gray-200 p-5 ${color}`}>
      <div className="flex items-center gap-2 mb-3">{icon}<span className="text-xs font-medium text-gray-600">{label}</span></div>
      <p className="text-3xl font-bold text-navy-900">{value}</p>
    </div>
  );
}
