"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MePayload } from "../../lib/types";
import { formatApiErrorMessage } from "../lib/errors";
import { fetchJson } from "../lib/fetchJson";

export function useMe(options?: {
  initialMe?: MePayload;
  autoFetch?: boolean;
}) {
  const initialMe = options?.initialMe ?? null;
  const autoFetch = options?.autoFetch ?? (initialMe == null);

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

  const clearError = useCallback(() => setError(null), []);

  return { me, refreshMe, loading, error, clearError };
}
