"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { formatApiErrorMessage } from "../lib/errors";
import { fetchJson } from "../lib/fetchJson";

export function useColorPicker(args: { refreshMe: () => Promise<void> | void }) {
  const { refreshMe } = args;
  const router = useRouter();

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
        // Refresh local state and invalidate Next.js router cache
        await refreshMe();
        router.refresh(); // Invalidate server component cache for next navigation
      } catch (err) {
        setChangeError(formatApiErrorMessage(err));
      } finally {
        setChanging(null);
      }
    },
    [changing, refreshMe, router],
  );

  return { changeColor, changing, changeError, clearChangeError };
}
