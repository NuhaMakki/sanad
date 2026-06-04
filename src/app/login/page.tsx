"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

const DEMO_ACCOUNTS = [
  { label: "طالب عادي", username: "student1", password: "password123", color: "bg-teal-50 border-teal-200 hover:bg-teal-100" },
  { label: "طالب خطر مرتفع", username: "student_risk", password: "password123", color: "bg-red-50 border-red-200 hover:bg-red-100" },
  { label: "مرشد أكاديمي", username: "advisor1", password: "password123", color: "bg-blue-50 border-blue-200 hover:bg-blue-100" },
  { label: "موظف خدمة", username: "staff1", password: "password123", color: "bg-amber-50 border-amber-200 hover:bg-amber-100" },
  { label: "مدير النظام", username: "admin", password: "password123", color: "bg-navy-50 border-navy-200 hover:bg-navy-100" },
];

const ROLE_REDIRECT: Record<string, string> = {
  STUDENT: "/student/dashboard",
  ADVISOR: "/advisor/dashboard",
  STAFF: "/staff/dashboard",
  ADMIN: "/admin/dashboard",
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (u: string, p: string) => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error ?? "خطأ في تسجيل الدخول");
        return;
      }
      router.push(ROLE_REDIRECT[data.data.role] ?? "/");
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    login(username, password);
  };

  const handleDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    login(u, p);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-teal-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-teal-500 mb-4">
            <GraduationCap className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">سند</h1>
          <p className="text-navy-300 mt-1 text-sm">منصة خدمة طلاب جامعة الإمام محمد بن سعود الإسلامية</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-navy-900 mb-6">تسجيل الدخول</h2>

          {error && <Alert variant="error" className="mb-4">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="اسم المستخدم"
              placeholder="أدخل اسم المستخدم"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
            <Input
              label="كلمة المرور"
              type="password"
              placeholder="أدخل كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              دخول
            </Button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6">
            <p className="text-xs text-gray-500 text-center mb-3">حسابات تجريبية للعرض</p>
            <div className="grid grid-cols-1 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.username}
                  onClick={() => handleDemo(acc.username, acc.password)}
                  disabled={loading}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors disabled:opacity-50 ${acc.color}`}
                >
                  <span className="text-gray-800">{acc.label}</span>
                  <span className="text-xs text-gray-500 font-mono">{acc.username}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
