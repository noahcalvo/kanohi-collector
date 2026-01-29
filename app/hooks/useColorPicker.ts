"use client";

import { useCallback, useState } from "react";
import { ApiError, fetchJson } from "../lib/fetchJson";

export function useColorPicker(args: { refreshMe: () => Promise<void> | void }) {
  const { refreshMe } = args;

  const [changing, setChanging] = useState<string | null>(null);
  const [changeError, setChangeError] = useState<string | null>(null);

  const clearChangeError = useCallback(() => {
    setChangeError(null);
  }, []);

  const changeColor = useCallback(
    async (maskId: string, color: string) => {
      setChanging(maskId);
      setChangeError(null);

      try {
        await fetchJson(`/api/mask/${maskId}/color`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ color }),
        });
        await refreshMe();
      } catch (err) {
        if (err instanceof ApiError) setChangeError(err.message);
        else
          setChangeError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setChanging(null);
      }
    },
    [refreshMe],
  );

  return { changeColor, changing, changeError, clearChangeError };
}
