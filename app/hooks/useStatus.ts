"use client";

import { useCallback, useEffect, useState } from "react";
import type { StatusPayload } from "../../lib/types";

export function useStatus() {
  const [status, setStatus] = useState<StatusPayload | null>(null);

  const refreshStatus = useCallback(async () => {
    const res = await fetch("/api/packs/status");
    if (!res.ok) return;
    const data = await res.json();
    setStatus(data);
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return { status, refreshStatus };
}
