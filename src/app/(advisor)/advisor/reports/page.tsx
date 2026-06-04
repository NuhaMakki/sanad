"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { FileText } from "lucide-react";

interface Report {
  id: string;
  type: string;
  isAiGenerated: boolean;
  createdAt: string;
  student: { user: { name: string }; studentNumber: string };
}

export default function AdvisorReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/list")
      .then((r) => r.json())
      .then((d) => setReports(d.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">جميع التقارير الأكاديمية التي أصدرتها</p>
      <Card padding={false}>
        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500">لا توجد تقارير بعد</p>
            <p className="text-xs text-gray-400 mt-1">قم بتوليد تقارير من ملفات الطلاب</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-start px-5 py-3 font-medium text-gray-600">التقرير</th>
                <th className="text-start px-5 py-3 font-medium text-gray-600">الطالب</th>
                <th className="text-start px-5 py-3 font-medium text-gray-600">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((rep) => (
                <tr key={rep.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-navy-900">
                    {rep.isAiGenerated ? "تقرير AI أكاديمي" : rep.type}
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-navy-800">{rep.student.user.name}</p>
                    <p className="text-xs text-gray-500">{rep.student.studentNumber}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {new Date(rep.createdAt).toLocaleDateString("ar-SA")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
