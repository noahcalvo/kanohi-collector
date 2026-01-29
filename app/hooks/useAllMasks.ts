import { useEffect, useState } from "react";
import type { Mask } from "../../lib/types";
import { ApiError, fetchJson } from "../lib/fetchJson";

export function useAllMasks() {
  const [masks, setMasks] = useState<Mask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMasks() {
      try {
        const data = await fetchJson<{ masks: Mask[] }>("/api/masks");
        setMasks(data.masks);
      } catch (err) {
        if (err instanceof ApiError) setError(err.message);
        else setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchMasks();
  }, []);

  return { masks, loading, error };
}
