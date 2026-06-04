"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
  user: { name: string; role: string } | null;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/audit?page=${page}`)
      .then((r) => r.json())
      .then((d) => {
        setLogs(d.data ?? []);
        setTotal(d.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        إجمالي {total} سجل — الصفحة {page} من {totalPages}
      </p>

      <Card padding={false}>
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-start px-5 py-3 font-medium text-gray-600">الإجراء</th>
                  <th className="text-start px-5 py-3 font-medium text-gray-600">المستخدم</th>
                  <th className="text-start px-5 py-3 font-medium text-gray-600">الكيان</th>
                  <th className="text-start px-5 py-3 font-medium text-gray-600">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs text-navy-800">{log.action}</td>
                    <td className="px-5 py-3">
                      {log.user ? (
                        <div>
                          <p className="text-navy-900">{log.user.name}</p>
                          <p className="text-xs text-gray-500">{log.user.role}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600 text-xs">
                      <p>{log.entityType}</p>
                      {log.entityId && <p className="font-mono text-gray-400">{log.entityId.slice(0, 8)}…</p>}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {new Date(log.createdAt).toLocaleString("ar-SA")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600">{page} / {totalPages}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
