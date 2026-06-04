"use client";

import { useEffect, useState, use } from "react";
import { RiskScoreCard } from "@/components/risk/RiskScoreCard";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { FileText, RefreshCw } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Input";

interface StudentDetail {
  id: string;
  studentNumber: string;
  gpa: number;
  warningCount: number;
  isGraduating: boolean;
  user: { name: string; username: string };
  department: { name: string };
  college: { name: string };
  riskScores: { score: number; level: string; reasons: string; calculatedAt: string }[];
  academicRecords: { semester: string; gpa: number; totalCredits: number; earnedCredits: number }[];
  attendanceRecords: { course: { name: string; code: string }; percentage: number; totalClasses: number; attendedClasses: number }[];
  advisorReports: { id: string; type: string; isAiGenerated: boolean; createdAt: string }[];
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [reportText, setReportText] = useState("");
  const [recalculating, setRecalculating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchStudent = async () => {
    const r = await fetch(`/api/students/${id}`);
    if (r.ok) {
      const d = await r.json();
      setStudent(d.data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchStudent(); }, [id]);

  const generateReport = async () => {
    setGenerating(true);
    setMessage(null);
    try {
      const r = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: id }),
      });
      const d = await r.json();
      if (r.ok) {
        setReportText(d.data.content);
        setReportModal(true);
      } else {
        setMessage({ type: "error", text: d.error ?? "فشل توليد التقرير" });
      }
    } finally {
      setGenerating(false);
    }
  };

  const saveReport = async () => {
    const r = await fetch("/api/reports/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: id, content: reportText, title: `تقرير أكاديمي — ${student?.user.name}` }),
    });
    if (r.ok) {
      setReportModal(false);
      setMessage({ type: "success", text: "تم حفظ التقرير" });
      fetchStudent();
    }
  };

  const recalculate = async () => {
    setRecalculating(true);
    await fetch("/api/risk/recalculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: id }),
    });
    await fetchStudent();
    setRecalculating(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (!student) return <p className="text-gray-500">لم يُعثر على الطالب.</p>;

  const riskScore = student.riskScores[0] ?? null;

  return (
    <div className="max-w-4xl space-y-6">
      {message && (
        <Alert variant={message.type === "success" ? "success" : "error"}>{message.text}</Alert>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">{student.user.name}</h2>
          <p className="text-gray-500">{student.studentNumber} — {student.department.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={recalculate} loading={recalculating}>
            <RefreshCw className="h-4 w-4" />
            إعادة الحساب
          </Button>
          <Button size="sm" onClick={generateReport} loading={generating}>
            <FileText className="h-4 w-4" />
            توليد تقرير AI
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Score */}
        <div className="lg:col-span-1">
          <RiskScoreCard riskScore={riskScore} />
        </div>

        {/* Academic Info */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle>المعلومات الأكاديمية</CardTitle></CardHeader>
            <div className="grid grid-cols-2 gap-4">
              <Info label="المعدل التراكمي" value={student.gpa.toFixed(2)} />
              <Info label="عدد الإنذارات" value={String(student.warningCount)} />
              <Info label="الكلية" value={student.college.name} />
              <Info label="خريج" value={student.isGraduating ? "نعم" : "لا"} />
            </div>
          </Card>

          {/* Attendance */}
          {student.attendanceRecords.length > 0 && (
            <Card>
              <CardHeader><CardTitle>سجل الحضور</CardTitle></CardHeader>
              <div className="space-y-2">
                {student.attendanceRecords.map((rec, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-navy-900">{rec.course.name}</p>
                      <p className="text-xs text-gray-500">{rec.course.code}</p>
                    </div>
                    <div className="text-end">
                      <p className={`text-sm font-bold ${rec.percentage < 75 ? "text-red-600" : "text-green-600"}`}>
                        {rec.percentage.toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-500">{rec.totalClasses - rec.attendedClasses} غياب</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Reports */}
      {student.advisorReports.length > 0 && (
        <Card>
          <CardHeader><CardTitle>التقارير السابقة</CardTitle></CardHeader>
          <div className="space-y-2">
            {student.advisorReports.map((rep) => (
              <div key={rep.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <p className="text-sm text-navy-900">{rep.isAiGenerated ? "تقرير AI" : rep.type}</p>
                <p className="text-xs text-gray-500">{new Date(rep.createdAt).toLocaleDateString("ar-SA")}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Report Modal */}
      <Modal open={reportModal} onClose={() => setReportModal(false)} title="التقرير المُولَّد بالذكاء الاصطناعي">
        <Textarea
          value={reportText}
          onChange={(e) => setReportText(e.target.value)}
          rows={16}
          className="font-mono text-xs"
        />
        <div className="flex gap-3 mt-4">
          <Button variant="outline" onClick={() => setReportModal(false)} className="flex-1">إلغاء</Button>
          <Button onClick={saveReport} className="flex-1">حفظ التقرير</Button>
        </div>
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-navy-900 mt-0.5">{value}</p>
    </div>
  );
}
