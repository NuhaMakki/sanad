"use client";

import { useEffect, useState } from "react";
import { BookingState } from "./QueueBookingFlow";
import { Button } from "@/components/ui/Button";
import { clsx } from "clsx";

interface IssueType {
  id: string;
  name: string;
  description: string | null;
  priority: string;
}

interface Props {
  unitId: string;
  onChange: (v: Partial<BookingState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepIssueType({ unitId, onChange, onNext, onBack }: Props) {
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/queue/units/${unitId}`)
      .then((r) => r.json())
      .then((d) => setIssueTypes(d.data?.issueTypes ?? []))
      .finally(() => setLoading(false));
  }, [unitId]);

  const handleNext = () => {
    const issue = issueTypes.find((i) => i.id === selected);
    if (!issue) return;
    onChange({ issueTypeId: selected, issueTypeName: issue.name });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-navy-900 mb-1">نوع المشكلة</h2>
        <p className="text-sm text-gray-500">اختر ما يصف طلبك بدقة</p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">جارٍ التحميل...</p>
      ) : (
        <div className="space-y-2">
          {issueTypes.map((issue) => (
            <button
              key={issue.id}
              onClick={() => setSelected(issue.id)}
              className={clsx(
                "w-full p-4 rounded-xl border-2 text-start transition-colors",
                selected === issue.id
                  ? "border-navy-700 bg-navy-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="flex items-center justify-between">
                <p className={clsx("font-medium text-sm", selected === issue.id ? "text-navy-900" : "text-gray-800")}>
                  {issue.name}
                </p>
                {issue.priority === "HIGH" && (
                  <span className="text-xs text-red-600 font-medium">أولوية عالية</span>
                )}
              </div>
              {issue.description && (
                <p className="text-xs text-gray-500 mt-1">{issue.description}</p>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          السابق
        </Button>
        <Button onClick={handleNext} disabled={!selected} className="flex-1">
          التالي
        </Button>
      </div>
    </div>
  );
}
