import { MAX_FRIEND_BUFF_SOURCES, PACK_LUCK_CAP } from "./constants";
import { db, getMask, getUserMasks } from "./store";
import type { BuffTotals, EquipSlot, UserMask } from "./types";

function maskBuffValue(mask: UserMask): BuffTotals {
  const def = getMask(mask.mask_id);
  if (!def)
    return { pack_luck: 0, timer_speed: 0, duplicate_eff: 0, discovery: 0 };
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

export function computeBuffs(userId: string): BuffTotals {
  const masks = getUserMasks(userId).filter((m) => m.equipped_slot !== "NONE");
  const totals = masks.reduce<BuffTotals>(
    (acc, mask) => {
      const val = maskBuffValue(mask);
      return {
        pack_luck: acc.pack_luck + val.pack_luck,
        timer_speed: acc.timer_speed + val.timer_speed,
        duplicate_eff: acc.duplicate_eff + val.duplicate_eff,
        discovery: acc.discovery + val.discovery,
      };
    },
    { pack_luck: 0, timer_speed: 0, duplicate_eff: 0, discovery: 0 }
  );

  // Simple friend buff: count up to MAX_FRIEND_BUFF_SOURCES friends with PACK_LUCK equipped
  const friendBuff = db.friends
    .filter((f) => f.user_id === userId && f.status === "ACCEPTED")
    .slice(0, MAX_FRIEND_BUFF_SOURCES)
    .reduce((sum) => sum + 0.0025, 0); // friend_buff_per_friend

  return {
    pack_luck: Math.min(totals.pack_luck + friendBuff, PACK_LUCK_CAP),
    timer_speed: totals.timer_speed,
    duplicate_eff: totals.duplicate_eff,
    discovery: totals.discovery,
  };
}