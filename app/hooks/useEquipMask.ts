"use client";

import { useCallback, useState } from "react";
import type { EquipSlot } from "../../lib/types";

export function useEquipMask(args: { refreshMe: () => Promise<void> | void }) {
  const { refreshMe } = args;

  const [equipping, setEquipping] = useState<string | null>(null);
  const [equipError, setEquipError] = useState<string | null>(null);

  const clearEquipError = useCallback(() => {
    setEquipError(null);
  }, []);

  const equipLabel = useCallback((maskId: string, slot: EquipSlot) => `${maskId}-${slot}` as const, []);

  const equip = useCallback(
    async (
      maskId: string,
      slot: EquipSlot,
      color?: string,
      transparent?: boolean
    ) => {
      setEquipping(equipLabel(maskId, slot));
      setEquipError(null);

      // If a color is provided, set it first
      if (color) {
        const colorRes = await fetch(`/api/mask/${maskId}/color`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ color }),
        });
        if (!colorRes.ok) {
          setEquipError("Color change failed");
          setEquipping(null);
          return;
        }
      }

      const res = await fetch(`/api/mask/${maskId}/equip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot }),
      });
      if (!res.ok) {
        setEquipError("Equip failed");
        setEquipping(null);
        return;
      }
      await refreshMe();
      setEquipping(null);
    },
    [equipLabel, refreshMe]
  );

  return { equip, equipping, equipError, clearEquipError };
}
