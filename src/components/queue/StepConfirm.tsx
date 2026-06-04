"use client";

import { useState } from "react";
import { BookingState } from "./QueueBookingFlow";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckCircle, MapPin, Tag, MessageSquare } from "lucide-react";

interface Props {
  state: BookingState;
  onBack: () => void;
  onSubmit: () => Promise<void>;
}

export function StepConfirm({ state, onBack, onSubmit }: Props) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-navy-900 mb-1">تأكيد الطلب</h2>
        <p className="text-sm text-gray-500">راجع تفاصيل طلبك قبل التأكيد</p>
      </div>

      <Card>
        <div className="space-y-4">
          <Row icon={<CheckCircle className="h-5 w-5 text-teal-500" />} label="الوحدة الخدمية" value={state.unitName} />
          <Row icon={<MapPin className="h-5 w-5 text-navy-500" />} label="الموقع"
            value={state.locationType === "ONCAMPUS" ? "داخل الجامعة" : "خارج الجامعة"} />
          <Row icon={<Tag className="h-5 w-5 text-amber-500" />} label="نوع المشكلة" value={state.issueTypeName} />
          {state.chatSummary && (
            <Row
              icon={<MessageSquare className="h-5 w-5 text-blue-500" />}
              label="ملخص المحادثة"
              value={state.chatSummary}
            />
          )}
        </div>
      </Card>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        سيتم إرسال إشعار إليك عند اقتراب دورك. تأكد من التواجد في الموعد المحدد.
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1" disabled={loading}>
          السابق
        </Button>
        <Button onClick={handleSubmit} loading={loading} className="flex-1">
          تأكيد الحجز
        </Button>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
