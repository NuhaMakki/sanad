"use client";

import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  createdAt: string;
  student?: { studentNumber: string; gpa: number } | null;
  advisor?: { id: string } | null;
  staff?: { serviceUnitId: string; isAvailable: boolean } | null;
}

const ROLE_LABELS: Record<string, string> = {
  STUDENT: "طالب",
  ADVISOR: "مرشد",
  STAFF: "موظف",
  ADMIN: "مدير",
};

const ROLE_VARIANTS: Record<string, "navy" | "info" | "warning" | "default"> = {
  STUDENT: "default",
  ADVISOR: "info",
  STAFF: "warning",
  ADMIN: "navy",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ username: "", name: "", password: "", role: "STUDENT" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    const params = roleFilter ? `?role=${roleFilter}` : "";
    const r = await fetch(`/api/admin/users${params}`);
    const d = await r.json();
    setUsers(d.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  const filtered = users.filter(
    (u) => u.name.includes(search) || u.username.includes(search)
  );

  const handleCreate = async () => {
    setSaving(true);
    setError("");
    const r = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await r.json();
    if (r.ok) {
      setModal(false);
      setForm({ username: "", name: "", password: "", role: "STUDENT" });
      fetchUsers();
    } else {
      setError(d.error ?? "فشل إنشاء المستخدم");
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث..."
            className="w-full rounded-xl border border-gray-300 ps-10 pe-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
        </div>
        <Select
          options={[
            { value: "", label: "كل الأدوار" },
            { value: "STUDENT", label: "طلاب" },
            { value: "ADVISOR", label: "مرشدون" },
            { value: "STAFF", label: "موظفون" },
            { value: "ADMIN", label: "مديرون" },
          ]}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-36"
        />
        <Button onClick={() => setModal(true)}>
          <Plus className="h-4 w-4" />
          مستخدم جديد
        </Button>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-start px-5 py-3 font-medium text-gray-600">الاسم</th>
                <th className="text-start px-5 py-3 font-medium text-gray-600">اسم المستخدم</th>
                <th className="text-start px-5 py-3 font-medium text-gray-600">الدور</th>
                <th className="text-start px-5 py-3 font-medium text-gray-600">تاريخ الإنشاء</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-navy-900">{u.name}</td>
                  <td className="px-5 py-3 text-gray-600 font-mono text-xs">{u.username}</td>
                  <td className="px-5 py-3">
                    <Badge variant={ROLE_VARIANTS[u.role] ?? "default"}>{ROLE_LABELS[u.role] ?? u.role}</Badge>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {new Date(u.createdAt).toLocaleDateString("ar-SA")}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-gray-500">لا توجد نتائج</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="إنشاء مستخدم جديد">
        <div className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <Input label="الاسم الكامل" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="اسم المستخدم" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <Input label="كلمة المرور" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Select
            label="الدور"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            options={[
              { value: "STUDENT", label: "طالب" },
              { value: "ADVISOR", label: "مرشد" },
              { value: "STAFF", label: "موظف" },
              { value: "ADMIN", label: "مدير" },
            ]}
          />
          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={() => setModal(false)} className="flex-1">إلغاء</Button>
            <Button onClick={handleCreate} loading={saving} className="flex-1">إنشاء</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
