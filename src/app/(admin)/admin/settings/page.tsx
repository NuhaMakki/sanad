"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Plus, Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";

interface PriorityRule {
  id: string;
  name: string;
  description: string | null;
  condition: string;
  scoreAdjustment: number;
  isActive: boolean;
}

interface KnowledgeSource {
  id: string;
  title: string;
  content: string;
  category: string;
}

export default function AdminSettingsPage() {
  const [rules, setRules] = useState<PriorityRule[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [ruleModal, setRuleModal] = useState(false);
  const [kbModal, setKbModal] = useState(false);
  const [ruleForm, setRuleForm] = useState({ name: "", condition: "", scoreAdjustment: 0, description: "" });
  const [kbForm, setKbForm] = useState({ title: "", content: "", category: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/priority-rules").then((r) => r.json()),
      fetch("/api/admin/knowledge").then((r) => r.json()),
    ]).then(([rulesData, kbData]) => {
      setRules(rulesData.data ?? []);
      setKnowledge(kbData.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const saveRule = async () => {
    setSaving(true);
    const r = await fetch("/api/admin/priority-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ruleForm),
    });
    const d = await r.json();
    if (r.ok) {
      setRules((prev) => [...prev, d.data]);
      setRuleModal(false);
      setRuleForm({ name: "", condition: "", scoreAdjustment: 0, description: "" });
      setMessage({ type: "success", text: "تم إضافة القاعدة" });
    }
    setSaving(false);
  };

  const saveKb = async () => {
    setSaving(true);
    const r = await fetch("/api/admin/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(kbForm),
    });
    const d = await r.json();
    if (r.ok) {
      setKnowledge((prev) => [...prev, d.data]);
      setKbModal(false);
      setKbForm({ title: "", content: "", category: "" });
      setMessage({ type: "success", text: "تم إضافة المصدر" });
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-6">
      {message && (
        <Alert variant={message.type}>{message.text}</Alert>
      )}

      {/* Priority Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>قواعد الأولوية</CardTitle>
            <Button size="sm" onClick={() => setRuleModal(true)}>
              <Plus className="h-4 w-4" />
              إضافة
            </Button>
          </div>
        </CardHeader>
        <div className="space-y-2">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div>
                <p className="text-sm font-medium text-navy-900">{rule.name}</p>
                <p className="text-xs text-gray-500">{rule.condition}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${rule.scoreAdjustment > 0 ? "text-red-600" : "text-green-600"}`}>
                  {rule.scoreAdjustment > 0 ? "+" : ""}{rule.scoreAdjustment}
                </span>
                {!rule.isActive && <span className="text-xs text-gray-400">معطّل</span>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Knowledge Base */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>مصادر معرفة الشات بوت</CardTitle>
            <Button size="sm" onClick={() => setKbModal(true)}>
              <Plus className="h-4 w-4" />
              إضافة
            </Button>
          </div>
        </CardHeader>
        <div className="space-y-2">
          {knowledge.map((kb) => (
            <div key={kb.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-navy-900">{kb.title}</p>
                  <p className="text-xs text-gray-500">{kb.category}</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{kb.content}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Rule Modal */}
      <Modal open={ruleModal} onClose={() => setRuleModal(false)} title="إضافة قاعدة أولوية">
        <div className="space-y-4">
          <Input label="اسم القاعدة" value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} />
          <Input label="شرط التطبيق" value={ruleForm.condition} onChange={(e) => setRuleForm({ ...ruleForm, condition: e.target.value })} />
          <Input label="التعديل على الدرجة" type="number" value={ruleForm.scoreAdjustment}
            onChange={(e) => setRuleForm({ ...ruleForm, scoreAdjustment: parseInt(e.target.value) || 0 })} />
          <Textarea label="وصف (اختياري)" value={ruleForm.description}
            onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })} rows={2} />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setRuleModal(false)} className="flex-1">إلغاء</Button>
            <Button onClick={saveRule} loading={saving} className="flex-1">حفظ</Button>
          </div>
        </div>
      </Modal>

      {/* KB Modal */}
      <Modal open={kbModal} onClose={() => setKbModal(false)} title="إضافة مصدر معرفة">
        <div className="space-y-4">
          <Input label="العنوان" value={kbForm.title} onChange={(e) => setKbForm({ ...kbForm, title: e.target.value })} />
          <Input label="الفئة" value={kbForm.category} onChange={(e) => setKbForm({ ...kbForm, category: e.target.value })} />
          <Textarea label="المحتوى" value={kbForm.content} onChange={(e) => setKbForm({ ...kbForm, content: e.target.value })} rows={5} />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setKbModal(false)} className="flex-1">إلغاء</Button>
            <Button onClick={saveKb} loading={saving} className="flex-1">حفظ</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
