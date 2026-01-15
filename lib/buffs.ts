import { PACK_LUCK_CAP } from "./constants";
import { masks as maskDefs } from "./staticData";
import type { GameStore } from "./store/gameStore";
import type { BuffTotals, EquipSlot, UserMask } from "./types";

function maskBuffValue(mask: UserMask): BuffTotals {
  const def = maskDefs.find((m) => m.mask_id === mask.mask_id);
  if (!def)
    return { pack_luck: 0, timer_speed: 0, duplicate_eff: 0, discovery: 0, inspect: 0 };
  const slotMultiplier =
    mask.equipped_slot === "TURAGA"
      ? 0.5
      : mask.equipped_slot === "TOA"
      ? 1
      : 0;
  const value = def.buff_base_value * mask.level * slotMultiplier;
  const zero: BuffTotals = {
    pack_luck: 0,
    timer_speed: 0,
    duplicate_eff: 0,
    discovery: 0,
    inspect: 0,
  };
  if (value === 0) return zero;
  switch (def.buff_type) {
    case "PACK_LUCK":
      return { ...zero, pack_luck: value };
    case "TIMER_SPEED":
      return { ...zero, timer_speed: value };
    case "DUPLICATE_EFF":
      return { ...zero, duplicate_eff: value };
    case "DISCOVERY":
      return { ...zero, discovery: value };
    default:
      return zero;
  }
}

export async function computeBuffs(
  userId: string,
  store: GameStore
): Promise<BuffTotals> {
  const masks = (await store.getUserMasks(userId)).filter(
    (m) => m.equipped_slot !== "NONE"
  );
  const totals = masks.reduce<BuffTotals>(
    (acc, mask) => {
      const val = maskBuffValue(mask);
      return {
        pack_luck: acc.pack_luck + val.pack_luck,
        timer_speed: acc.timer_speed + val.timer_speed,
        duplicate_eff: acc.duplicate_eff + val.duplicate_eff,
        discovery: acc.discovery + val.discovery,
        inspect: acc.inspect + val.inspect,
      };
    },
    { pack_luck: 0, timer_speed: 0, duplicate_eff: 0, discovery: 0, inspect: 0 }
  );

  // Friends are not persisted yet in the DB-backed MVP.
  const friendBuff = 0;

  return {
    pack_luck: Math.min(totals.pack_luck + friendBuff, PACK_LUCK_CAP),
    timer_speed: totals.timer_speed,
    duplicate_eff: totals.duplicate_eff,
    discovery: totals.discovery,
    inspect: totals.inspect,
  };
}