"use client";

import { useCallback, useEffect, useState } from "react";
import type { MePayload } from "../../lib/types";

export function useMe() {
  const [me, setMe] = useState<MePayload | null>(null);

  const refreshMe = useCallback(async () => {
    console.log("Fetching /api/me");
    const res = await fetch("/api/me");
    if (!res.ok) {
      console.error("Failed to fetch /api/me", res.statusText);
      return;
    }
    console.log("Fetching /fart");
    const data = await res.json();
    console.log("Fetched /api/me", data);
    setMe(data);
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  return { me, refreshMe };
}
