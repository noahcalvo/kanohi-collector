"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StatusPayload } from "../../lib/types";
import { ApiError, fetchJson } from "../lib/fetchJson";

export function useStatus(options?: {
  initialStatus?: StatusPayload;
  autoFetch?: boolean;
}) {
  const initialStatus = options?.initialStatus ?? null;
  const autoFetch = options?.autoFetch ?? (initialStatus == null);

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
      });
      setStatus(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (err instanceof ApiError) setError(err.message);
      else setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!autoFetch) return;
    refreshStatus();
    return () => abortRef.current?.abort();
  }, [autoFetch, refreshStatus]);

  const clearError = useCallback(() => setError(null), []);

  return { status, refreshStatus, loading, error, clearError };
}
