"use client";

import { useCallback, useState } from "react";
import { formatApiErrorMessage } from "../lib/errors";
import { fetchJson } from "../lib/fetchJson";

export function useColorPicker(args: { refreshMe: () => Promise<void> | void }) {
  const { refreshMe } = args;

  const [changing, setChanging] = useState<string | null>(null);
  const [changeError, setChangeError] = useState<string | null>(null);

  const clearChangeError = useCallback(() => {
    setChangeError(null);
  }, []);

  const changeColor = useCallback(
    async (maskId: string, color: string) => {
      if (changing) return;
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
        setChangeError(formatApiErrorMessage(err));
      } finally {
        setChanging(null);
      }
    },
    [changing, refreshMe],
  );

  return { changeColor, changing, changeError, clearChangeError };
}
