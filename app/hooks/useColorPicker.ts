"use client";

import { useCallback, useState } from "react";

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

      const res = await fetch(`/api/mask/${maskId}/color`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color }),
      });
      if (!res.ok) {
        setChangeError("Color change failed");
        setChanging(null);
        return;
      }
      await refreshMe();
      setChanging(null);
    },
    [refreshMe],
  );

  return { changeColor, changing, changeError, clearChangeError };
}
