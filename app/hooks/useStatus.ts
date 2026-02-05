"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StatusPayload } from "../../lib/types";
import { formatApiErrorMessage } from "../lib/errors";
import { fetchJson } from "../lib/fetchJson";

export function useStatus(options?: {
  initialStatus?: StatusPayload;
  autoFetch?: boolean;
  refreshOnFocus?: boolean;
}) {
  const initialStatus = options?.initialStatus ?? null;
  const autoFetch = options?.autoFetch ?? (initialStatus == null);
  const refreshOnFocus = options?.refreshOnFocus ?? true;

  const [status, setStatus] = useState<StatusPayload | null>(initialStatus);
  const [loading, setLoading] = useState<boolean>(initialStatus == null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refreshStatus = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson<StatusPayload>("/api/packs/status", {
        signal: controller.signal,
        cache: "no-store", // Prevent caching stale data
      });
      setStatus(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!autoFetch) return;
    refreshStatus();
    return () => abortRef.current?.abort();
  }, [autoFetch, refreshStatus]);

  // Refresh when page becomes visible (user returns from another tab/page)
  useEffect(() => {
    if (!refreshOnFocus) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshStatus();
      }
    };

    const handleFocus = () => {
      refreshStatus();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshOnFocus, refreshStatus]);

  const clearError = useCallback(() => setError(null), []);

  return { status, refreshStatus, loading, error, clearError };
}
