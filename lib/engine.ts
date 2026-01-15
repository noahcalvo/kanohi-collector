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
import type { GameStore } from "./store/gameStore";
import { prismaStore } from "./store/prismaStore";
import { masks as maskDefs, packs as packDefs } from "./staticData";
import type { CollectionMask, DrawResultItem, Mask, OpenResult, Rarity, UserMask, EquipSlot } from "./types";

const db = {
  masks: maskDefs,
  packs: packDefs,
};

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function refreshFractionalUnits<
  T extends { fractional_units: number; last_unit_ts: Date }
>(progress: T, timerSpeedBonus: number): T {
  if (PACK_UNIT_SECONDS <= 0) {
    progress.fractional_units = PACK_UNITS_PER_PACK;
    progress.last_unit_ts = new Date();
    return progress;
  }

  const current = nowSeconds();
  const last = Math.floor(progress.last_unit_ts.getTime() / 1000);
  const elapsed = Math.max(current - last, 0);
  const speedMultiplier = 1 + timerSpeedBonus;
  const unitsGained = Math.floor((elapsed * speedMultiplier) / PACK_UNIT_SECONDS);
  if (unitsGained > 0) {
    progress.fractional_units = Math.min(
      progress.fractional_units + unitsGained,
      PACK_UNITS_PER_PACK
    );
    const newTimestampSeconds =
      last + Math.floor((unitsGained * PACK_UNIT_SECONDS) / speedMultiplier);
    progress.last_unit_ts = new Date(newTimestampSeconds * 1000);
  }
  return progress;
}

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

const COLOR_PALETTES_BY_SET_AND_RARITY: Record<
  string,
  Record<Rarity, string[]>
> = {
  "1": {
    COMMON: [
      "standard",
      "orange",
      "perriwinkle",
      "lime",
      "tan",
      "light gray",
      "dark gray",
    ],
    RARE: ["standard", "red", "blue", "green", "brown", "white", "black"],
    MYTHIC: ["standard"],
  },
};

const DEFAULT_COLORS_BY_RARITY: Record<Rarity, string[]> = {
  COMMON: [
    "standard",
    "orange",
    "perriwinkle",
    "lime",
    "tan",
    "light gray",
    "dark gray",
  ],
  RARE: ["standard", "red", "blue", "green", "brown", "white", "black"],
  MYTHIC: ["standard"],
};

// available colors depend on rarity and set id
export function getAvailableColors(rarity: Rarity, setId: number): string[] {
  if (rarity === "MYTHIC") return ["standard"];

  const setPalette = COLOR_PALETTES_BY_SET_AND_RARITY[setId]?.[rarity];

  if (setPalette?.length) return setPalette;
  return DEFAULT_COLORS_BY_RARITY[rarity];
}

function sampleColor(
  def: Mask,
  unlockedColors: string[],
  rand: () => number
): string {
  // Get available colors based on rarity
  const allNonStandardColors = getAvailableColors(
    def.base_rarity,
    def.generation
  ).filter((c) => c !== "standard");
  const remainingColors = allNonStandardColors.filter(
    (c) => !unlockedColors.includes(c)
  );

  if (remainingColors.length === 0) {
    return "standard";
  }

  // Build weights for the unlock mechanic:
  // - Original color gets 20%
  // - Remaining colors split the other 20%
  // - Standard gets 60%
  const colorWeights: Record<string, number> = {};
  const numRemaining = remainingColors.length;
  const otherColorProb = 0.2 / numRemaining;

  colorWeights["standard"] = 0.6;
  for (const color of remainingColors) {
    colorWeights[color] = color === def.original_color ? 0.2 : otherColorProb;
  }

  const colors = Object.keys(colorWeights);
  const weights = colors.map((c) => colorWeights[c]);
  return weightedSample(colors, weights, rand);
}

function sampleMaskByRarity(
  rarity: Rarity,
  rand: () => number,
  exclude: Set<string>,
  ownedMaskIds: ReadonlySet<string>
): Mask {
  const candidates = db.masks.filter(
    (m) => m.base_rarity === rarity && !exclude.has(m.mask_id)
  );
  if (candidates.length === 0) {
    throw new Error("No masks available for rarity");
  }
  const weights = candidates.map((m) => (ownedMaskIds.has(m.mask_id) ? 0.2 : 1));
  return weightedSample(candidates, weights, rand);
}

function trySampleMaskByRarity(
  rarity: Rarity,
  rand: () => number,
  exclude: Set<string>,
  ownedMaskIds: ReadonlySet<string>
): Mask | null {
  const candidates = db.masks.filter(
    (m) => m.base_rarity === rarity && !exclude.has(m.mask_id)
  );
  if (candidates.length === 0) return null;
  const weights = candidates.map((m) => (ownedMaskIds.has(m.mask_id) ? 0.2 : 1));
  return weightedSample(candidates, weights, rand);
}

function ensureUserMaskLocal(
  userId: string,
  maskId: string,
  userMaskByMaskId: Map<string, UserMask>
): UserMask {
  const existing = userMaskByMaskId.get(maskId);
  if (existing) return existing;
  const created: UserMask = {
    id: randomUUID(),
    user_id: userId,
    mask_id: maskId,
    owned_count: 0,
    essence: 0,
    level: 1,
    equipped_slot: "NONE",
    unlocked_colors: [],
    equipped_color: "standard",
    last_acquired_at: new Date(),
  };
  userMaskByMaskId.set(maskId, created);
  return created;
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
  }
  return mask;
}

function discoveryReroll(
  rarity: Rarity,
  rand: () => number,
  discoveryBonus: number,
  currentMask: Mask,
  ownedMaskIds: ReadonlySet<string>
): Mask {
  if (!discoveryBonus) return currentMask;
  let selected = currentMask;
  for (let i = 0; i < DISCOVERY_ATTEMPTS_LIMIT; i += 1) {
    const chance = Math.min(discoveryBonus, DISCOVERY_REROLL_CAP);
    if (rand() >= chance) break;
    const exclude = new Set<string>([selected.mask_id]);
    const candidate = trySampleMaskByRarity(rarity, rand, exclude, ownedMaskIds);
    if (!candidate) break;
    if (!ownedMaskIds.has(candidate.mask_id)) {
      selected = candidate;
      break;
    }
    selected = candidate;
  }
  return selected;
}

export async function openPack(
  userId: string,
  packId: string,
  opts?: { seed?: string },
  store: GameStore = prismaStore
): Promise<OpenResult> {
  await store.getOrCreateUser(userId);
  const pack = db.packs.find((p) => p.pack_id === packId);
  if (!pack) throw new Error("Pack not found");

  let progress = await store.getUserPackProgress(userId, packId);
  if (!progress) {
    progress = {
      user_id: userId,
      pack_id: packId,
      fractional_units: PACK_UNITS_PER_PACK,
      last_unit_ts: new Date(),
      pity_counter: 0,
      last_pack_claim_ts: null,
    };
    await store.upsertUserPackProgress(progress);
  }

  const userMasks = await store.getUserMasks(userId);
  const userMaskByMaskId = new Map(userMasks.map((m) => [m.mask_id, m] as const));
  const ownedMaskIds = new Set(
    userMasks.filter((m) => m.owned_count > 0).map((m) => m.mask_id)
  );

  const buffs = await computeBuffs(userId, store);
  const refreshed = refreshFractionalUnits({ ...progress }, buffs.timer_speed);
  if (refreshed.fractional_units < PACK_UNITS_PER_PACK) {
    throw new Error("Pack not ready");
  }

  const seed = opts?.seed ?? `${userId}-${Date.now()}-${GLOBAL_SEED_SALT}`;
  const rand = seededRandom(seed);

  let pityFlag = refreshed.pity_counter >= PITY_THRESHOLD;
  const results: DrawResultItem[] = [];
  let sawRarePlus = false;

  for (let i = 0; i < pack.masks_per_pack; i += 1) {
    const rarity =
      pityFlag && i === 0
        ? sampleRarityForceRarePlus(buffs.pack_luck, rand)
        : sampleRarityWithPackLuck(buffs.pack_luck, rand);
    if (rarity !== "COMMON") sawRarePlus = true;

    const exclude = new Set<string>();
    let mask = sampleMaskByRarity(rarity, rand, exclude, ownedMaskIds);
    mask = discoveryReroll(rarity, rand, buffs.discovery, mask, ownedMaskIds);

    let userMask = ensureUserMaskLocal(userId, mask.mask_id, userMaskByMaskId);
    const color =
      mask.base_rarity === "MYTHIC"
        ? mask.original_color
        : sampleColor(mask, userMask.unlocked_colors, rand);
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

    const wasColorNew =
      color !== "standard" && !userMask.unlocked_colors.includes(color);
    if (wasColorNew) {
      userMask.unlocked_colors = addColor(userMask.unlocked_colors, color);
    }

    userMask.last_acquired_at = new Date();
    userMask = applyLeveling(userMask, rarityKey);

    userMaskByMaskId.set(userMask.mask_id, userMask);
    if (userMask.owned_count > 0) ownedMaskIds.add(userMask.mask_id);
    await store.upsertUserMask(userMask);

    await store.appendEvent({
      event_id: randomUUID(),
      user_id: userId,
      type: "mask_pull",
      payload: {
        mask_id: mask.mask_id,
        rarity,
        color,
        is_new: isNew,
        was_color_new: wasColorNew,
      },
      timestamp: new Date(),
    });

    results.push({
      mask_id: mask.mask_id,
      name: mask.name,
      rarity,
      color,
      is_new: isNew,
      was_color_new: wasColorNew,
      essence_awarded: essenceAwarded,
      essence_remaining: userMask.essence,
      final_essence_remaining: userMask.essence,
      level_before: levelBefore,
      level_after: userMask.level,
      final_level_after: userMask.level,
      unlocked_colors: userMask.unlocked_colors,
      transparent: mask.transparent,
    });

    if (pityFlag) pityFlag = false;
  }

  const maskStates = new Map<
    string,
    { essence_remaining: number; level_after: number }
  >();
  for (const result of results) {
    const currentUserMask = userMaskByMaskId.get(result.mask_id);
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
  const updatedProgress = {
    ...refreshed,
    fractional_units: refreshed.fractional_units - PACK_UNITS_PER_PACK,
    pity_counter: nextPity,
    last_pack_claim_ts: new Date(),
  };
  await store.upsertUserPackProgress(updatedProgress);

  await store.appendEvent({
    event_id: randomUUID(),
    user_id: userId,
    type: "pack_open",
    payload: { pack_id: pack.pack_id, results },
    timestamp: new Date(),
  });

  return { masks: results, pity_counter: nextPity };
}

export async function packStatus(
  userId: string,
  packId: string,
  store: GameStore = prismaStore
) {
  const progress = await store.getUserPackProgress(userId, packId);
  if (!progress) throw new Error("Pack progress missing");
  const buffs = await computeBuffs(userId, store);
  const refreshed = refreshFractionalUnits({ ...progress }, buffs.timer_speed);
  await store.upsertUserPackProgress(refreshed);

  if (PACK_UNIT_SECONDS <= 0) {
    return {
      pack_ready: true,
      time_to_ready: 0,
      fractional_units: PACK_UNITS_PER_PACK,
      pity_counter: refreshed.pity_counter,
    };
  }

  const timeSince = Math.floor(
    (Date.now() - refreshed.last_unit_ts.getTime()) / 1000
  );
  const speedMultiplier = 1 + buffs.timer_speed;
  const unitsGained = (timeSince * speedMultiplier) / PACK_UNIT_SECONDS;
  const unitsNeeded = Math.max(
    PACK_UNITS_PER_PACK - refreshed.fractional_units,
    0
  );
  const timeToReady = Math.max(
    Math.ceil((unitsNeeded * PACK_UNIT_SECONDS) / speedMultiplier),
    0
  );
  return {
    pack_ready: refreshed.fractional_units >= PACK_UNITS_PER_PACK,
    time_to_ready:
      refreshed.fractional_units >= PACK_UNITS_PER_PACK ? 0 : timeToReady,
    fractional_units: refreshed.fractional_units,
    pity_counter: refreshed.pity_counter,
  };
}

export async function mePayload(userId: string, store: GameStore = prismaStore) {
  const user = await store.getOrCreateUser(userId);
  if (!user) throw new Error("User not found");
  const buffs = await computeBuffs(userId, store);
  const progress = await store.getUserPackProgress(userId, "free_daily_v1");
  if (!progress) throw new Error("Pack progress missing");
  const status = await packStatus(userId, "free_daily_v1", store);
  const userMasks = await store.getUserMasks(userId);
  const equipped = userMasks.filter((m) => m.equipped_slot !== "NONE");
  const unlockedColors: Record<string, string[]> = {};
  userMasks.forEach((m) => {
    unlockedColors[m.mask_id] = m.unlocked_colors;
  });

  const collection: CollectionMask[] = userMasks.map((um) => {
    const def = db.masks.find((m) => m.mask_id === um.mask_id);
    return {
      mask_id: um.mask_id,
      name: def?.name ?? um.mask_id,
      generation: def?.generation ?? 1,
      rarity: def?.base_rarity ?? "COMMON",
      level: um.level,
      essence: um.essence,
      owned_count: um.owned_count,
      equipped_slot: um.equipped_slot,
      unlocked_colors: um.unlocked_colors,
      equipped_color: um.equipped_color,
      transparent: def?.transparent,
      buff_type: def?.buff_type ?? "VISUAL",
      description: def?.description ?? "",
      origin: def?.origin ?? "",
      offsetY: def?.maskOffsetY ?? 0,
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
    color_availability: calculateColorAvailability(userMasks),
  };
}

function calculateColorAvailability(
  userMasks: UserMask[]
): Record<string, { owned: number; available: number }> {
  const colorStats: Record<string, { owned: number; available: number }> = {};

  // Get all possible colors across all rarities
  const allPossibleColors = new Set<string>();
  Object.values(DEFAULT_COLORS_BY_RARITY).forEach((colors) => {
    colors.forEach((c) => allPossibleColors.add(c));
  });

  // For each color, count owned and calculate available
  allPossibleColors.forEach((color) => {
    let owned = 0;
    let available = 0;

    // Count masks that can have this color
    db.masks.forEach((mask) => {
      const maskColors = getAvailableColors(mask.base_rarity, mask.generation);
      if (maskColors.includes(color)) {
        available++;
        // Check if user has unlocked this color on this mask
        const userMask = userMasks.find((um) => um.mask_id === mask.mask_id);
        if (userMask && userMask.unlocked_colors.includes(color)) {
          owned++;
        }
      }
    });

    if (available > 0) {
      colorStats[color] = { owned, available };
    }
  });

  return colorStats;
}

export async function equipMask(
  userId: string,
  maskId: string,
  slot: EquipSlot,
  store: GameStore = prismaStore
) {
  await store.getOrCreateUser(userId);
  const target = await store.getUserMask(userId, maskId);
  if (!target) throw new Error("User does not own mask");

  // clear slot occupancy if another mask is there
  if (slot !== "NONE") {
    const masks = await store.getUserMasks(userId);
    await Promise.all(
      masks
        .filter((m) => m.equipped_slot === slot && m.mask_id !== maskId)
        .map(async (m) => {
          await store.upsertUserMask({ ...m, equipped_slot: "NONE" });
        })
    );
  }

  target.equipped_slot = slot;
  await store.upsertUserMask(target);
  await store.appendEvent({
    event_id: randomUUID(),
    user_id: userId,
    type: "equip",
    payload: { mask_id: maskId, slot },
    timestamp: new Date(),
  });
  return target;
}

export async function setMaskColor(
  userId: string,
  maskId: string,
  color: string,
  store: GameStore = prismaStore
) {
  await store.getOrCreateUser(userId);
  const target = await store.getUserMask(userId, maskId);
  if (!target) throw new Error("User does not own mask");

  // Get the mask definition
  const maskDef = db.masks.find((m) => m.mask_id === maskId);
  if (!maskDef) throw new Error("Mask definition not found");

  // Mythic masks can only use their original color
  if (maskDef.base_rarity === "MYTHIC" && color !== maskDef.original_color) {
    throw new Error("Mythic masks can only be their original color");
  }

  // Verify the color is unlocked
  if (!target.unlocked_colors.includes(color) && color !== "standard") {
    throw new Error("Color not unlocked");
  }

  target.equipped_color = color;
  await store.upsertUserMask(target);
  await store.appendEvent({
    event_id: randomUUID(),
    user_id: userId,
    type: "color_change",
    payload: { mask_id: maskId, color },
    timestamp: new Date(),
  });
  return target;
}

