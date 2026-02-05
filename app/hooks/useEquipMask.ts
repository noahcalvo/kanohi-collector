"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { EquipSlot } from "../../lib/types";
import { formatApiErrorMessage } from "../lib/errors";
import { ApiError, fetchJson } from "../lib/fetchJson";

export function useEquipMask(args: { refreshMe: () => Promise<void> | void }) {
  const { refreshMe } = args;
  const router = useRouter();

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

      const tryEquip = async (confirmPackTrim: boolean) => {
        await fetchJson(`/api/mask/${maskId}/equip`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slot,
            ...(confirmPackTrim ? { confirm_pack_trim: true } : {}),
          }),
        });
      };

      try {
        // If a color is provided, set it first
        if (color) {
          await fetchJson(`/api/mask/${maskId}/color`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ color }),
          });
        }

        try {
          await tryEquip(false);
        } catch (err) {
          if (err instanceof ApiError && err.status === 409) {
            const body = err.body as any;
            if (body?.code === "PACK_STORAGE_TRIM_CONFIRM") {
              const stored = Number(body?.stored_packs ?? NaN);
              const nextCap = Number(body?.next_pack_cap ?? NaN);
              const excess = Number(body?.excess_packs ?? NaN);
              const ok = window.confirm(
                `This will reduce your pack storage to ${nextCap}. You currently have ${stored} packs saved.\n\nIf you continue, you'll lose ${excess} pack${excess === 1 ? "" : "s"}.`,
              );
              if (!ok) return;
              await tryEquip(true);
            } else {
              throw err;
            }
          } else {
            throw err;
          }
        }

        // Refresh local state and invalidate Next.js router cache
        await refreshMe();
        router.refresh(); // Invalidate server component cache for next navigation
      } catch (err) {
        setEquipError(formatApiErrorMessage(err));
      } finally {
        setEquipping(null);
      }
    },
    [equipLabel, equipping, refreshMe, router]
  );

  return { equip, equipping, equipError, clearEquipError };
}
