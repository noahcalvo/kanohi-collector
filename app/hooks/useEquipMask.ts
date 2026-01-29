"use client";

import { useCallback, useState } from "react";
import type { EquipSlot } from "../../lib/types";
import { formatApiErrorMessage } from "../lib/errors";
import { fetchJson } from "../lib/fetchJson";

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
      if (equipping) return;
      setEquipping(equipLabel(maskId, slot));
      setEquipError(null);

      try {
        // If a color is provided, set it first
        if (color) {
          await fetchJson(`/api/mask/${maskId}/color`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ color }),
          });
        }

        await fetchJson(`/api/mask/${maskId}/equip`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slot }),
        });

        await refreshMe();
      } catch (err) {
        setEquipError(formatApiErrorMessage(err));
      } finally {
        setEquipping(null);
      }
    },
    [equipLabel, equipping, refreshMe]
  );

  return { equip, equipping, equipError, clearEquipError };
}
