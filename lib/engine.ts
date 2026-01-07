import { randomUUID } from "crypto";
import {
  DISCOVERY_ATTEMPTS_LIMIT,
  DISCOVERY_REROLL_CAP,
  DUPLICATE_ESSENCE_BY_RARITY,
  GLOBAL_SEED_SALT,
  LEVEL_BASE_BY_RARITY,
  MAX_LEVEL_BY_RARITY,
  PACK_UNITS_PER_PACK,
  PACK_UNIT_SECONDS,
  PITY_THRESHOLD,
  RARITY_BASE_PROBS,
} from "./constants";
import { computeBuffs } from "./buffs";
import {
  appendEvent,
  db,
  getPack,
  getUser,
  getUserMask,
  getUserMasks,
  getUserPackProgress,
  refreshFractionalUnits,
  updateUserPackProgress,
  upsertUserMask,
} from "./store";
import type { CollectionMask, DrawResultItem, Mask, OpenResult, Rarity, UserMask, EquipSlot } from "./types";

function seededRandom(seed: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += h << 13;
    h ^= h >>> 7;
    h += h << 3;
    h ^= h >>> 17;
    h += h << 5;
    return (h >>> 0) / 4294967296;
  };
}

function weightedSample<T>(items: T[], weights: number[], rand: () => number): T {
  const total = weights.reduce((a, b) => a + b, 0);
  const r = rand() * total;
  let acc = 0;
  for (let i = 0; i < items.length; i += 1) {
    acc += weights[i];
    if (r <= acc) return items[i];
  }
  return items[items.length - 1];
}

function sampleRarityWithPackLuck(bonus: number, rand: () => number): Rarity {
  const rarePlusBase = RARITY_BASE_PROBS.MYTHIC + RARITY_BASE_PROBS.RARE;
  const scale = 1 + bonus;
  const rare = RARITY_BASE_PROBS.RARE * scale;
  const mythic = RARITY_BASE_PROBS.MYTHIC * scale;
  const common = Math.max(1 - (rare + mythic), 1e-6);
  const weights = [mythic, rare, common];
  return weightedSample(["MYTHIC", "RARE", "COMMON"], weights, rand);
}

function sampleRarityForceRarePlus(bonus: number, rand: () => number): Rarity {
  const rare = RARITY_BASE_PROBS.RARE * (1 + bonus);
  const mythic = RARITY_BASE_PROBS.MYTHIC * (1 + bonus);
  const weights = [mythic, rare];
  return weightedSample(["MYTHIC", "RARE"], weights, rand);
}

function sampleColor(def: Mask, rand: () => number): string {
  const colors = Object.keys(def.base_color_distribution);
  const weights = colors.map((c) => def.base_color_distribution[c]);
  return weightedSample(colors, weights, rand);
}

function sampleMaskByRarity(userId: string, rarity: Rarity, rand: () => number, exclude: Set<string>): Mask {
  const candidates = db.masks.filter((m) => m.base_rarity === rarity && !exclude.has(m.mask_id));
  if (candidates.length === 0) {
    throw new Error("No masks available for rarity");
  }
  const weights = candidates.map((m) => (getUserMask(userId, m.mask_id) ? 0.2 : 1));
  return weightedSample(candidates, weights, rand);
}

function ensureUserMask(userId: string, maskId: string): UserMask {
  const existing = getUserMask(userId, maskId);
  if (existing) return existing;
  return {
    id: randomUUID(),
    user_id: userId,
    mask_id: maskId,
    owned_count: 0,
    essence: 0,
    level: 1,
    equipped_slot: "NONE",
    unlocked_colors: [],
    last_acquired_at: new Date(),
  };
}
function addColor(unlocked: string[], color: string): string[] {
  return unlocked.includes(color) ? unlocked : [...unlocked, color];
}

function applyLeveling(mask: UserMask, rarity: Rarity): UserMask {
  const base = LEVEL_BASE_BY_RARITY[rarity];
  const maxLevel = MAX_LEVEL_BY_RARITY[rarity];
  while (mask.level < maxLevel) {
    const cost = base * mask.level;
    if (mask.essence < cost) break;
    mask.essence -= cost;
    mask.level += 1;
    appendEvent({ event_id: randomUUID(), type: "level_up", user_id: mask.user_id, payload: { mask_id: mask.mask_id, level: mask.level }, timestamp: new Date() });
  }
  return mask;
}

function discoveryReroll(userId: string, rarity: Rarity, rand: () => number, discoveryBonus: number, currentMask: Mask): Mask {
  if (!discoveryBonus) return currentMask;
  let selected = currentMask;
  for (let i = 0; i < DISCOVERY_ATTEMPTS_LIMIT; i += 1) {
    const chance = Math.min(discoveryBonus, DISCOVERY_REROLL_CAP);
    if (rand() >= chance) break;
    const exclude = new Set<string>([selected.mask_id]);
    const candidate = sampleMaskByRarity(userId, rarity, rand, exclude);
    if (!getUserMask(userId, candidate.mask_id)) {
      selected = candidate;
      break;
    }
    selected = candidate;
  }
  return selected;
}

export function openPack(userId: string, packId: string, opts?: { seed?: string }): OpenResult {
  const user = getUser(userId);
  if (!user) throw new Error("User not found");
  const pack = getPack(packId);
  if (!pack) throw new Error("Pack not found");
  const progress = getUserPackProgress(userId, packId);
  if (!progress) throw new Error("Pack progress missing");

  const buffs = computeBuffs(userId);
  const refreshed = refreshFractionalUnits({ ...progress }, buffs.timer_speed);
  const unitsAvailable = refreshed.fractional_units;
  if (unitsAvailable < PACK_UNITS_PER_PACK) {
    throw new Error("Pack not ready");
  }

  const seed = opts?.seed ?? `${userId}-${Date.now()}-${GLOBAL_SEED_SALT}`;
  const rand = seededRandom(seed);

  let pityFlag = refreshed.pity_counter >= PITY_THRESHOLD;
  const results: DrawResultItem[] = [];
  let sawRarePlus = false;

  for (let i = 0; i < pack.masks_per_pack; i += 1) {
    const rarity = pityFlag && i === 0 ? sampleRarityForceRarePlus(buffs.pack_luck, rand) : sampleRarityWithPackLuck(buffs.pack_luck, rand);
    if (rarity !== "COMMON") sawRarePlus = true;
    const exclude = new Set<string>();
    let mask = sampleMaskByRarity(userId, rarity, rand, exclude);
    mask = discoveryReroll(userId, rarity, rand, buffs.discovery, mask);
    const color = sampleColor(mask, rand);

    let userMask = ensureUserMask(userId, mask.mask_id);
    const isNew = userMask.owned_count === 0;
    const rarityKey = mask.base_rarity;
    let essenceAwarded = 0;
    if (!isNew) {
      const baseEssence = DUPLICATE_ESSENCE_BY_RARITY[rarityKey];
      essenceAwarded = Math.round(baseEssence * (1 + buffs.duplicate_eff));
      userMask.essence += essenceAwarded;
    }

    const levelBefore = userMask.level;
    userMask.owned_count += 1;
    userMask.unlocked_colors = addColor(userMask.unlocked_colors, color);
    userMask.last_acquired_at = new Date();
    userMask = applyLeveling(userMask, rarityKey);
    upsertUserMask(userMask);

    appendEvent({
      event_id: randomUUID(),
      user_id: userId,
      type: "mask_pull",
      payload: { mask_id: mask.mask_id, rarity, color, is_new: isNew },
      timestamp: new Date(),
    });

    results.push({
      mask_id: mask.mask_id,
      name: mask.name,
      rarity,
      color,
      is_new: isNew,
      essence_awarded: essenceAwarded,
      essence_remaining: userMask.essence,
      final_essence_remaining: userMask.essence,
      level_before: levelBefore,
      level_after: userMask.level,
      final_level_after: userMask.level,
      unlocked_colors: userMask.unlocked_colors,
    });

    if (pityFlag) pityFlag = false;
  }

  // Update all duplicate mask_ids in results to show final essence_remaining and level_after
  const maskStates = new Map<string, { essence_remaining: number; level_after: number }>();
  for (const result of results) {
    const currentUserMask = getUserMask(userId, result.mask_id);
    if (currentUserMask) {
      maskStates.set(result.mask_id, {
        essence_remaining: currentUserMask.essence,
        level_after: currentUserMask.level,
      });
    }
  }
  for (const result of results) {
    const finalState = maskStates.get(result.mask_id);
    if (finalState) {
      result.final_essence_remaining = finalState.essence_remaining;
      result.final_level_after = finalState.level_after;
    }
  }

  const nextPity = sawRarePlus ? 0 : refreshed.pity_counter + 1;
  const updatedProgress = { ...refreshed, fractional_units: refreshed.fractional_units - PACK_UNITS_PER_PACK, pity_counter: nextPity, last_pack_claim_ts: new Date() };
  updateUserPackProgress(updatedProgress);

  appendEvent({ event_id: randomUUID(), user_id: userId, type: "pack_open", payload: { pack_id: pack.pack_id, results }, timestamp: new Date() });

  return { masks: results, pity_counter: nextPity };
}

export function packStatus(userId: string, packId: string) {
  const progress = getUserPackProgress(userId, packId);
  if (!progress) throw new Error("Pack progress missing");
  const buffs = computeBuffs(userId);
  const refreshed = refreshFractionalUnits({ ...progress }, buffs.timer_speed);
  updateUserPackProgress(refreshed);

  if (PACK_UNIT_SECONDS <= 0) {
    return {
      pack_ready: true,
      time_to_ready: 0,
      fractional_units: PACK_UNITS_PER_PACK,
      pity_counter: refreshed.pity_counter,
    };
  }

  const timeSince = Math.floor((Date.now() - refreshed.last_unit_ts.getTime()) / 1000);
  const speedMultiplier = 1 + buffs.timer_speed;
  const unitsGained = (timeSince * speedMultiplier) / PACK_UNIT_SECONDS;
  const unitsNeeded = Math.max(PACK_UNITS_PER_PACK - refreshed.fractional_units, 0);
  const timeToReady = Math.max(Math.ceil((unitsNeeded * PACK_UNIT_SECONDS) / speedMultiplier), 0);
  return {
    pack_ready: refreshed.fractional_units >= PACK_UNITS_PER_PACK,
    time_to_ready: refreshed.fractional_units >= PACK_UNITS_PER_PACK ? 0 : timeToReady,
    fractional_units: refreshed.fractional_units,
    pity_counter: refreshed.pity_counter,
  };
}

export function mePayload(userId: string) {
  const user = getUser(userId);
  if (!user) throw new Error("User not found");
  const buffs = computeBuffs(userId);
  const progress = getUserPackProgress(userId, "free_daily_v1");
  if (!progress) throw new Error("Pack progress missing");
  const status = packStatus(userId, "free_daily_v1");
  const userMasks = getUserMasks(userId);
  const equipped = userMasks.filter((m) => m.equipped_slot !== "NONE");
  const unlockedColors: Record<string, string[]> = {};
  userMasks.forEach((m) => { unlockedColors[m.mask_id] = m.unlocked_colors; });

  const collection: CollectionMask[] = userMasks.map((um) => {
    const def = db.masks.find((m) => m.mask_id === um.mask_id);
    return {
      mask_id: um.mask_id,
      name: def?.name ?? um.mask_id,
      rarity: def?.base_rarity ?? "COMMON",
      level: um.level,
      essence: um.essence,
      owned_count: um.owned_count,
      equipped_slot: um.equipped_slot,
      unlocked_colors: um.unlocked_colors,
    };
  });

  return {
    user,
    equipped,
    total_buffs: buffs,
    next_pack_ready_in_seconds: status.time_to_ready,
    fractional_units: progress.fractional_units,
    unlocked_colors: unlockedColors,
    collection,
  };
}

export function equipMask(userId: string, maskId: string, slot: EquipSlot) {
  const user = getUser(userId);
  if (!user) throw new Error("User not found");
  const target = getUserMask(userId, maskId);
  if (!target) throw new Error("User does not own mask");

  // clear slot occupancy if another mask is there
  if (slot !== "NONE") {
    getUserMasks(userId)
      .filter((m) => m.equipped_slot === slot && m.mask_id !== maskId)
      .forEach((m) => {
        m.equipped_slot = "NONE";
        upsertUserMask(m);
      });
  }

  target.equipped_slot = slot;
  upsertUserMask(target);
  appendEvent({ event_id: randomUUID(), user_id: userId, type: "equip", payload: { mask_id: maskId, slot }, timestamp: new Date() });
  return target;
}
