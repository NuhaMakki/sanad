"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { RiskBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";

interface Student {
  id: string;
  studentNumber: string;
  gpa: number;
  warningCount: number;
  user: { name: string };
  department: { name: string };
  riskScores: { score: number; level: string }[];
}

export default function AdvisorStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/advisor/students")
      .then((r) => r.json())
      .then((d) => setStudents(d.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter(
    (s) =>
      s.user.name.includes(search) ||
      s.studentNumber.includes(search) ||
      s.department.name.includes(search)
  );

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث بالاسم أو الرقم..."
          className="w-full rounded-xl border border-gray-300 ps-10 pe-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
        />
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-start px-5 py-3 font-medium text-gray-600">الطالب</th>
                <th className="text-start px-5 py-3 font-medium text-gray-600">الرقم الجامعي</th>
                <th className="text-start px-5 py-3 font-medium text-gray-600">المعدل</th>
                <th className="text-start px-5 py-3 font-medium text-gray-600">الإنذارات</th>
                <th className="text-start px-5 py-3 font-medium text-gray-600">مستوى الخطر</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const risk = s.riskScores[0];
                return (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-navy-900">{s.user.name}</p>
                      <p className="text-xs text-gray-500">{s.department.name}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{s.studentNumber}</td>
                    <td className="px-5 py-3 font-medium text-navy-700">{s.gpa.toFixed(2)}</td>
                    <td className="px-5 py-3 text-gray-700">{s.warningCount}</td>
                    <td className="px-5 py-3">
                      {risk ? <RiskBadge level={risk.level} /> : <span className="text-gray-400 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/advisor/students/${s.id}`}
                        className="text-teal-600 hover:underline text-xs font-medium"
                      >
                        عرض الملف
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-500">
                    لا توجد نتائج
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
