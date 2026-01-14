import { useEffect, useState } from "react";
import type { Mask } from "../../lib/types";

export function useAllMasks() {
  const [masks, setMasks] = useState<Mask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMasks() {
      try {
        const res = await fetch("/api/masks");
        if (!res.ok) {
          throw new Error("Failed to fetch masks");
        }
        const data = await res.json();
        setMasks(data.masks);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchMasks();
  }, []);

  return { masks, loading, error };
}
