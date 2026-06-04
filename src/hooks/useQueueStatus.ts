"use client";

import { useState, useCallback } from "react";
import { usePolling } from "./usePolling";

export type QueueStatus = {
  position: number;
  totalWaiting: number;
  etaMinutes: number;
  status: string;
};

export function useQueueStatus(unitId: string | null) {
  const [status, setStatus] = useState<QueueStatus | null>(null);

  const fetch_ = useCallback(async () => {
    if (!unitId) return;
    try {
      const r = await fetch(`/api/queue/status/${unitId}`);
      if (!r.ok) return;
      const { data } = await r.json();
      setStatus(data);
    } catch {
      // silent
    }
  }, [unitId]);

  usePolling(fetch_, 10000, !!unitId);

  return status;
}
