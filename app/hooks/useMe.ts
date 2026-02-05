"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MePayload } from "../../lib/types";
import { formatApiErrorMessage } from "../lib/errors";
import { fetchJson } from "../lib/fetchJson";

export function useMe(options?: {
  initialMe?: MePayload;
  autoFetch?: boolean;
  refreshOnFocus?: boolean;
}) {
  const initialMe = options?.initialMe ?? null;
  const autoFetch = options?.autoFetch ?? (initialMe == null);
  const refreshOnFocus = options?.refreshOnFocus ?? true;

  const [me, setMe] = useState<MePayload | null>(initialMe);
  const [loading, setLoading] = useState<boolean>(initialMe == null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refreshMe = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson<MePayload>("/api/me", {
        signal: controller.signal,
        cache: "no-store", // Prevent caching stale data
      });
      setMe(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!autoFetch) return;
    refreshMe();
    return () => abortRef.current?.abort();
  }, [autoFetch, refreshMe]);

  // Refresh when page becomes visible (user returns from another tab/page)
  useEffect(() => {
    if (!refreshOnFocus) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshMe();
      }
    };

    const handleFocus = () => {
      refreshMe();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshOnFocus, refreshMe]);

  const clearError = useCallback(() => setError(null), []);

  return { me, refreshMe, loading, error, clearError };
}
