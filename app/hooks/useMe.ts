"use client";

import { useCallback, useEffect, useState } from "react";
import type { MePayload } from "../../lib/types";

export function useMe() {
  const [me, setMe] = useState<MePayload | null>(null);

  const refreshMe = useCallback(async () => {
    const res = await fetch("/api/me");
    if (!res.ok) {
      console.error("Failed to fetch /api/me", res.statusText);
      return;
    }
    const data = await res.json();
    setMe(data);
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  return { me, refreshMe };
}
