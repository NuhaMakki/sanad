"use client";

import { useEffect, useState } from "react";
import { BookingState } from "./QueueBookingFlow";
import { Button } from "@/components/ui/Button";
import { MapPin, Home } from "lucide-react";
import { clsx } from "clsx";

interface ServiceUnit {
  id: string;
  name: string;
  description: string;
  type: string;
  isAvailable: boolean;
}

interface Props {
  value: Partial<BookingState>;
  onChange: (v: Partial<BookingState>) => void;
  onNext: () => void;
}

export function StepLocation({ value, onChange, onNext }: Props) {
  const [units, setUnits] = useState<ServiceUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationType, setLocationType] = useState<"ONCAMPUS" | "OFFCAMPUS">(
    value.locationType ?? "ONCAMPUS"
  );
  const [selectedUnit, setSelectedUnit] = useState(value.unitId ?? "");

  useEffect(() => {
    fetch("/api/queue/units")
      .then((r) => r.json())
      .then((d) => setUnits(d.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleNext = () => {
    const unit = units.find((u) => u.id === selectedUnit);
    if (!unit) return;
    onChange({ unitId: selectedUnit, unitName: unit.name, locationType });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-navy-900 mb-1">اختر موقعك</h2>
        <p className="text-sm text-gray-500">هل أنت داخل الحرم الجامعي أم خارجه؟</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(["ONCAMPUS", "OFFCAMPUS"] as const).map((loc) => {
          const Icon = loc === "ONCAMPUS" ? MapPin : Home;
          const label = loc === "ONCAMPUS" ? "داخل الجامعة" : "خارج الجامعة";
          return (
            <button
              key={loc}
              onClick={() => setLocationType(loc)}
              className={clsx(
                "flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-colors",
                locationType === loc
                  ? "border-navy-700 bg-navy-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <Icon className={clsx("h-8 w-8", locationType === loc ? "text-navy-700" : "text-gray-400")} />
              <span className={clsx("font-medium text-sm", locationType === loc ? "text-navy-900" : "text-gray-600")}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      <div>
        <h3 className="font-semibold text-navy-900 mb-3">اختر الوحدة الخدمية</h3>
        {loading ? (
          <p className="text-sm text-gray-500">جارٍ التحميل...</p>
        ) : (
          <div className="space-y-2">
            {units.map((u) => (
              <button
                key={u.id}
                disabled={!u.isAvailable}
                onClick={() => setSelectedUnit(u.id)}
                className={clsx(
                  "w-full flex items-center justify-between p-4 rounded-xl border-2 text-start transition-colors",
                  !u.isAvailable && "opacity-50 cursor-not-allowed",
                  selectedUnit === u.id
                    ? "border-navy-700 bg-navy-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div>
                  <p className={clsx("font-medium", selectedUnit === u.id ? "text-navy-900" : "text-gray-800")}>
                    {u.name}
                  </p>
                  <p className="text-xs text-gray-500">{u.description}</p>
                </div>
                {!u.isAvailable && (
                  <span className="text-xs text-red-500 font-medium">مغلق</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <Button onClick={handleNext} disabled={!selectedUnit} className="w-full">
        التالي
      </Button>
    </div>
  );
}
