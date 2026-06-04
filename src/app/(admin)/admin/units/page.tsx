"use client";

import { useEffect, useState } from "react";
import { QrCode, ToggleLeft, ToggleRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";

interface ServiceUnit {
  id: string;
  name: string;
  type: string;
  isAvailable: boolean;
  description: string;
}

export default function AdminUnitsPage() {
  const [units, setUnits] = useState<ServiceUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrUnit, setQrUnit] = useState<ServiceUnit | null>(null);
  const [qrSrc, setQrSrc] = useState("");
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/units")
      .then((r) => r.json())
      .then((d) => setUnits(d.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const toggleAvailability = async (unit: ServiceUnit) => {
    await fetch(`/api/admin/units/${unit.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !unit.isAvailable }),
    });
    setUnits((prev) => prev.map((u) => u.id === unit.id ? { ...u, isAvailable: !u.isAvailable } : u));
  };

  const showQR = async (unit: ServiceUnit) => {
    setQrUnit(unit);
    setQrLoading(true);
    const r = await fetch(`/api/queue/qr/${unit.id}`);
    if (r.ok) {
      const blob = await r.blob();
      setQrSrc(URL.createObjectURL(blob));
    }
    setQrLoading(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">إدارة الوحدات الخدمية وعرض QR codes للطباعة</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {units.map((unit) => (
          <Card key={unit.id}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-navy-900">{unit.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{unit.type}</p>
              </div>
              <button
                onClick={() => toggleAvailability(unit)}
                className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-colors
                  ${unit.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
              >
                {unit.isAvailable
                  ? <><ToggleRight className="h-4 w-4" /> مفتوح</>
                  : <><ToggleLeft className="h-4 w-4" /> مغلق</>}
              </button>
            </div>
            {unit.description && <p className="text-xs text-gray-600 mb-3">{unit.description}</p>}
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => showQR(unit)}
            >
              <QrCode className="h-4 w-4" />
              عرض QR Code
            </Button>
          </Card>
        ))}
      </div>

      <Modal
        open={!!qrUnit}
        onClose={() => { setQrUnit(null); setQrSrc(""); }}
        title={qrUnit?.name ?? ""}
      >
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-gray-600 text-center">
            امسح هذا الرمز للوصول المباشر لحجز خدمة هذه الوحدة
          </p>
          {qrLoading ? (
            <Spinner />
          ) : qrSrc ? (
            <img src={qrSrc} alt="QR Code" className="w-48 h-48" />
          ) : null}
          {qrSrc && (
            <a
              href={qrSrc}
              download={`qr-${qrUnit?.id}.png`}
              className="text-teal-600 text-sm hover:underline"
            >
              تنزيل للطباعة
            </a>
          )}
        </div>
      </Modal>
    </div>
  );
}
