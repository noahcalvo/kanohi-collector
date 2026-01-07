"use client";

import { useMemo } from "react";
import type { EquipSlot } from "../../lib/types";
import { CollectionMaskCard } from "../components/MaskCards";
import { useEquipMask } from "../hooks/useEquipMask";
import { useMe } from "../hooks/useMe";

export default function CollectionPage() {
  const { me, refreshMe } = useMe();
  const { equip, equipping, equipError, clearEquipError } = useEquipMask({ refreshMe });

  const equipAndClear = async (maskId: string, slot: EquipSlot) => {
    clearEquipError();
    await equip(maskId, slot);
  };

  const maskNameById = useMemo(
    () => new Map(me?.collection?.map((m) => [m.mask_id, m.name] as const) ?? []),
    [me?.collection],
  );

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Collection</h1>
          <p className="text-slate-600 text-sm leading-relaxed">Browse your masks and equip Toa/Turaga.</p>
        </div>
        {me && <div className="text-sm text-slate-600">{me.user.username}</div>}
      </header>

      <section className="card">
        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Your masks</h2>
        {me ? (
          me.collection.length === 0 ? (
            <p className="text-slate-500 text-sm mt-3">No masks owned yet. Open a pack to start collecting.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              {me.collection.map((m) => (
                <CollectionMaskCard
                  key={m.mask_id}
                  mask={{ ...m, name: maskNameById.get(m.mask_id) ?? m.name }}
                  onEquip={equipAndClear}
                  equipping={equipping}
                />
              ))}
            </div>
          )
        ) : (
          <p className="text-slate-500 text-sm mt-3">Loading...</p>
        )}
      </section>

      {equipError && <p className="text-rose-700 text-sm">{equipError}</p>}
    </div>
  );
}
