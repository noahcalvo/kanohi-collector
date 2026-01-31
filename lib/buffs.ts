import { PACK_LUCK_CAP, PACK_CD_CAP, COLOR_BUFF_CAP } from "./constants";
import { masks as maskDefs } from "./staticData";
import type { GameStore } from "./store/gameStore";
import type { BuffTotals, UserMask } from "./types";

function maskBuffValue(mask: UserMask): BuffTotals {
  const def = maskDefs.find((m) => m.mask_id === mask.mask_id);
  if (!def)
    return {
      rarity_odds: 0,
      cd_reduction: 0,
      protodermis: 0,
      discovery: 0,
      inspection: 0,
      color_variants: 0,
      friend_bonus: 0,
      pack_stacking: 0,
    };
  const slotMultiplier =
    mask.equipped_slot === "TURAGA"
      ? 0.5
      : mask.equipped_slot === "TOA"
        ? 1
        : 0;
  const value = def.buff_base_value * mask.level * slotMultiplier;
  const zero: BuffTotals = {
    rarity_odds: 0,
    cd_reduction: 0,
    protodermis: 0,
    discovery: 0,
    inspection: 0,
    color_variants: 0,
    friend_bonus: 0,
    pack_stacking: 0,
  };
  if (value === 0) return zero;
  switch (def.buff_type) {
    case "RARITY_ODDS":
      return { ...zero, rarity_odds: value };
    case "CD_REDUCTION":
      return { ...zero, cd_reduction: value };
    case "PROTODERMIS":
      return { ...zero, protodermis: value };
    case "DISCOVERY":
      return { ...zero, discovery: value };
    case "INSPECTION":
      return { ...zero, inspection: value };
    case "COLOR_VARIANTS":
      return { ...zero, color_variants: value };
    case "FRIEND_BONUS":
      return { ...zero, friend_bonus: value };
    case "PACK_STACKING":
      return { ...zero, pack_stacking: value };
    default:
      return zero;
  }
}

export function noBuffs(): BuffTotals {
  return {
    rarity_odds: 0,
    cd_reduction: 0,
    protodermis: 0,
    discovery: 0,
    inspection: 0,
    color_variants: 0,
    friend_bonus: 0,
    pack_stacking: 0,
  };
}

export function computeBuffsFromUserMasks(userMasks: UserMask[]): BuffTotals {
  const masks = userMasks.filter((m) => m.equipped_slot !== "NONE");
  const totals = masks.reduce<BuffTotals>(
    (acc, mask) => {
      const val = maskBuffValue(mask);
      return {
        rarity_odds: acc.rarity_odds + val.rarity_odds,
        cd_reduction: acc.cd_reduction + val.cd_reduction,
        protodermis: acc.protodermis + val.protodermis,
        discovery: acc.discovery + val.discovery,
        inspection: acc.inspection + val.inspection,
        color_variants: (acc.color_variants || 0) + (val.color_variants || 0),
        friend_bonus: (acc.friend_bonus || 0) + (val.friend_bonus || 0),
        pack_stacking: (acc.pack_stacking || 0) + (val.pack_stacking || 0),
      };
    },
    {
      rarity_odds: 0,
      cd_reduction: 0,
      protodermis: 0,
      discovery: 0,
      inspection: 0,
      color_variants: 0,
      friend_bonus: 0,
      pack_stacking: 0,
    },
  );

  // Friends are not persisted yet in the DB-backed MVP.
  const friendBuff = 0;

  return {
    rarity_odds: Math.min(totals.rarity_odds + friendBuff, PACK_LUCK_CAP),
    cd_reduction: Math.min(totals.cd_reduction, PACK_CD_CAP),
    protodermis: totals.protodermis,
    discovery: totals.discovery,
    inspection: totals.inspection,
    color_variants: Math.min(totals.color_variants, COLOR_BUFF_CAP),
    friend_bonus: totals.friend_bonus,
    pack_stacking: totals.pack_stacking,
  };
}

export async function computeBuffs(
  userId: string,
  store: GameStore,
): Promise<BuffTotals> {
  const masks = await store.getUserMasks(userId);
  return computeBuffsFromUserMasks(masks);
}
